import axios from "axios";
import SocialConnection from "../models/social.model.js";
import messageModel from "../models/message.model.js";

const FB_GRAPH_VER = "v21.0";
const IG_GRAPH_VER = "v21.0";

/**
 * Normalizes media URL ensuring https and correct formatting
 */
function cleanMediaUrl(url, isVideo = false) {
    if (!url) return "";
    let final = url.trim();
    if (final.startsWith("http://")) {
        final = final.replace("http://", "https://");
    } else if (!final.startsWith("https://")) {
        final = "https://" + final;
    }
    // Apply 1080w transform for ImageKit images only (never videos)
    if (!isVideo && final.includes("ik.imagekit.io") && !final.includes("/tr:")) {
        const endpoint = process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io";
        const filePath = final.replace(endpoint, "");
        const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
        final = `${endpoint}/tr:w-1080,f-jpg${cleanPath}`;
    }
    return final;
}

function isVideoUrl(url, item) {
    if (item?.fileType === 'video' || item?.mimetype?.startsWith('video/')) return true;
    return url?.includes("/perplexity/videos") || /\.(mp4|mov|webm|m4v|ogg)(\?|$)/i.test(url || "");
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTAGRAM PUBLISHING (Single, Video Reel, and Multi-Image Carousel)
// ─────────────────────────────────────────────────────────────────────────────
async function publishToInstagram(mediaItems, caption, connection, postMode = "together") {
    const accessToken = connection.accessToken?.trim();
    const userId = connection.platformUserId?.trim();
    if (!accessToken || !userId) throw new Error("Instagram access credentials missing.");

    // Separate mode: publish each media individually
    if (postMode === "separately" && mediaItems.length > 1) {
        const results = [];
        for (let i = 0; i < mediaItems.length; i++) {
            const item = mediaItems[i];
            const itemCaption = `${caption} (${i + 1}/${mediaItems.length})`;
            const res = await publishToInstagram([item], itemCaption, connection, "together");
            results.push(res);
            await new Promise(r => setTimeout(r, 4000)); // Rate limit buffer between posts
        }
        return {
            mediaId: results.map(r => r.mediaId).join(", "),
            postType: "separate",
            details: results
        };
    }

    // CAROUSEL MODE: If multiple media items and mode is "together"
    if (mediaItems.length > 1) {
        console.log(`📸 [IG-Publisher] Creating CAROUSEL with ${mediaItems.length} items...`);
        const itemContainerIds = [];

        for (const item of mediaItems) {
            const isVideo = isVideoUrl(item.url, item);
            const url = cleanMediaUrl(item.url, isVideo);
            const itemPayload = {
                is_carousel_item: true,
                access_token: accessToken
            };
            if (isVideo) {
                itemPayload.media_type = "VIDEO";
                itemPayload.video_url = url;
            } else {
                itemPayload.image_url = url;
            }

            const itemRes = await axios.post(
                `https://graph.instagram.com/${IG_GRAPH_VER}/${userId}/media`,
                itemPayload
            );
            itemContainerIds.push(itemRes.data.id);
            // Brief wait for container registration
            await new Promise(r => setTimeout(r, 1500));
        }

        // Wait for all child containers to finish encoding
        console.log("⏳ [IG-Publisher] Waiting for carousel items processing...");
        await new Promise(r => setTimeout(r, 8000));

        // Create the parent Carousel Container
        const carouselRes = await axios.post(
            `https://graph.instagram.com/${IG_GRAPH_VER}/${userId}/media`,
            {
                media_type: "CAROUSEL",
                children: itemContainerIds,
                caption: caption,
                access_token: accessToken
            }
        );
        const carouselContainerId = carouselRes.data.id;

        // Wait and poll parent carousel readiness
        console.log("⏳ [IG-Publisher] Polling carousel container status...");
        let isReady = false;
        let attempts = 0;
        while (!isReady && attempts < 10) {
            await new Promise(r => setTimeout(r, 3000));
            attempts++;
            try {
                const statusRes = await axios.get(
                    `https://graph.instagram.com/${IG_GRAPH_VER}/${carouselContainerId}`,
                    { params: { fields: "status_code", access_token: accessToken } }
                );
                if (statusRes.data?.status_code === "FINISHED") isReady = true;
                else if (statusRes.data?.status_code === "ERROR") throw new Error("Carousel processing failed on Instagram");
            } catch (e) {
                if (attempts >= 4) isReady = true;
            }
        }

        // Final publish
        const publishRes = await axios.post(
            `https://graph.instagram.com/${IG_GRAPH_VER}/${userId}/media_publish`,
            { creation_id: carouselContainerId, access_token: accessToken }
        );

        console.log("🎉 [IG-Publisher] Carousel Published! ID:", publishRes.data.id);
        return { mediaId: publishRes.data.id, postType: "carousel" };
    }

    // SINGLE MEDIA: Photo or Video Reel
    const single = mediaItems[0];
    const isVideo = isVideoUrl(single.url, single);
    const url = cleanMediaUrl(single.url, isVideo);

    const containerPayload = {
        caption: caption,
        access_token: accessToken
    };
    if (isVideo) {
        containerPayload.media_type = "REELS";
        containerPayload.video_url = url;
    } else {
        containerPayload.image_url = url;
    }

    let resultMediaId = null;
    try {
        const igResponse = await axios.post(
            `https://graph.instagram.com/${IG_GRAPH_VER}/${userId}/media`,
            containerPayload
        );
        resultMediaId = igResponse.data.id;
    } catch (igErr) {
        if (!accessToken.startsWith("IG")) {
            // Facebook Graph fallback for Page-linked Instagram accounts
            const fbResponse = await axios.post(
                `https://graph.facebook.com/${FB_GRAPH_VER}/${userId}/media`,
                containerPayload
            );
            resultMediaId = fbResponse.data.id;
        } else {
            throw new Error(`Instagram API Error: ${igErr.response?.data?.error?.message || igErr.message}`);
        }
    }

    if (!resultMediaId) throw new Error("Could not create Instagram media container");

    // Video processing poll
    if (isVideo) {
        let isReady = false;
        let attempts = 0;
        while (!isReady && attempts < 15) {
            await new Promise(r => setTimeout(r, 3000));
            attempts++;
            try {
                const statusRes = await axios.get(
                    `https://graph.instagram.com/${IG_GRAPH_VER}/${resultMediaId}`,
                    { params: { fields: "status_code", access_token: accessToken } }
                );
                if (statusRes.data?.status_code === "FINISHED") isReady = true;
                else if (statusRes.data?.status_code === "ERROR") throw new Error("Video processing failed on Instagram");
            } catch (e) {
                if (attempts >= 4) isReady = true;
            }
        }
    } else {
        await new Promise(r => setTimeout(r, 4000));
    }

    // Publish single container
    const publishRes = await axios.post(
        `https://graph.instagram.com/${IG_GRAPH_VER}/${userId}/media_publish`,
        { creation_id: resultMediaId, access_token: accessToken }
    );

    return { mediaId: publishRes.data.id, postType: isVideo ? "reel" : "single" };
}

// ─────────────────────────────────────────────────────────────────────────────
// FACEBOOK PUBLISHING (Single Photo, Multi-Photo Post, Video, or Text)
// ─────────────────────────────────────────────────────────────────────────────
async function publishToFacebook(mediaItems, caption, connection, postMode = "together") {
    const accessToken = connection.accessToken?.trim();
    const pageId = connection.meta?.pageId || connection.platformUserId?.trim();
    if (!accessToken || !pageId) throw new Error("Facebook access token or Page ID missing.");

    // Multi-photo or single photo
    if (mediaItems && mediaItems.length > 0) {
        if (postMode === "separately" && mediaItems.length > 1) {
            const results = [];
            for (let i = 0; i < mediaItems.length; i++) {
                const res = await publishToFacebook([mediaItems[i]], `${caption} (${i + 1}/${mediaItems.length})`, connection, "together");
                results.push(res);
                await new Promise(r => setTimeout(r, 2000));
            }
            return { mediaId: results.map(r => r.mediaId).join(", "), postType: "separate" };
        }

        if (mediaItems.length === 1) {
            const item = mediaItems[0];
            const isVideo = isVideoUrl(item.url, item);
            const url = cleanMediaUrl(item.url, isVideo);

            if (isVideo) {
                const res = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VER}/${pageId}/videos`, {
                    file_url: url,
                    description: caption,
                    access_token: accessToken
                });
                return { mediaId: res.data.id, postType: "video" };
            } else {
                const res = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VER}/${pageId}/photos`, {
                    url: url,
                    caption: caption,
                    access_token: accessToken
                });
                return { mediaId: res.data.id || res.data.post_id, postType: "single" };
            }
        }

        // Multi-photo Facebook Post (album / together)
        console.log(`📘 [FB-Publisher] Uploading ${mediaItems.length} photos to Facebook Page...`);
        const photoIds = [];
        for (const item of mediaItems) {
            const url = cleanMediaUrl(item.url, false);
            const uploadRes = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VER}/${pageId}/photos`, {
                url: url,
                published: false,
                access_token: accessToken
            });
            if (uploadRes.data?.id) photoIds.push(uploadRes.data.id);
        }

        // Create feed post attaching all photos
        const feedRes = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VER}/${pageId}/feed`, {
            message: caption,
            attached_media: photoIds.map(id => ({ media_fbid: id })),
            access_token: accessToken
        });

        return { mediaId: feedRes.data.id, postType: "multi-photo" };
    }

    // Text status post
    const textRes = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VER}/${pageId}/feed`, {
        message: caption,
        access_token: accessToken
    });
    return { mediaId: textRes.data.id, postType: "text" };
}

// ─────────────────────────────────────────────────────────────────────────────
// TWITTER / X PUBLISHING
// ─────────────────────────────────────────────────────────────────────────────
async function publishToTwitter(mediaItems, caption, connection, postMode = "together") {
    const accessToken = connection.accessToken?.trim();
    if (!accessToken) throw new Error("Twitter / X access token missing.");

    // Direct tweet endpoint (Twitter API v2)
    const tweetPayload = {
        text: caption.length > 280 ? caption.slice(0, 277) + "..." : caption
    };

    const res = await axios.post("https://api.twitter.com/2/tweets", tweetPayload, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        }
    });

    return { mediaId: res.data?.data?.id || "tweet_live", postType: "tweet" };
}

// ─────────────────────────────────────────────────────────────────────────────
// LINKEDIN PUBLISHING
// ─────────────────────────────────────────────────────────────────────────────
async function publishToLinkedIn(mediaItems, caption, connection) {
    const accessToken = connection.accessToken?.trim();
    const authorUrn = `urn:li:person:${connection.platformUserId}`;
    if (!accessToken) throw new Error("LinkedIn access token missing.");

    const payload = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text: caption },
                shareMediaCategory: "NONE"
            }
        },
        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    const res = await axios.post("https://api.linkedin.com/v2/ugcPosts", payload, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json"
        }
    });

    return { mediaId: res.data?.id || "linkedin_post", postType: "post" };
}

// ─────────────────────────────────────────────────────────────────────────────
// PINTEREST PUBLISHING
// ─────────────────────────────────────────────────────────────────────────────
async function publishToPinterest(mediaItems, caption, connection) {
    const accessToken = connection.accessToken?.trim();
    if (!accessToken) throw new Error("Pinterest access token missing.");

    const boardId = connection.meta?.boardId || "default";
    const media = mediaItems[0];
    const url = cleanMediaUrl(media?.url, false);

    const payload = {
        board_id: boardId,
        media_source: {
            source_type: "image_url",
            url: url
        },
        title: caption.slice(0, 95),
        description: caption
    };

    const res = await axios.post("https://api.pinterest.com/v5/pins", payload, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        }
    });

    return { mediaId: res.data?.id || "pin_live", postType: "pin" };
}

// ─────────────────────────────────────────────────────────────────────────────
// YOUTUBE PUBLISHING (Shorts & Standard Video Upload via YouTube Data API v3)
// ─────────────────────────────────────────────────────────────────────────────
async function publishToYouTube(mediaItems, caption, connection, scheduledTime = null) {
    const accessToken = connection.accessToken?.trim();
    if (!accessToken) throw new Error("YouTube access token missing.");

    // Find first video item
    const videoItem = mediaItems.find(item => isVideoUrl(item.url, item));
    if (!videoItem || !videoItem.url) {
        throw new Error("YouTube only supports video uploads (Shorts or Videos). Please attach an MP4/MOV/WebM video file for YouTube.");
    }

    const videoUrl = cleanMediaUrl(videoItem.url, true);

    // Fetch video stream/buffer
    const videoResponse = await axios.get(videoUrl, { responseType: "arraybuffer", timeout: 60000 });
    const videoBuffer = Buffer.from(videoResponse.data);

    // Extract title (first line up to 90 chars) and tags
    const lines = caption.split("\n").filter(l => l.trim().length > 0);
    const title = (lines[0] || "New Video via Parsu AI").slice(0, 95);
    const description = caption;

    // Detect if valid future scheduled time provided
    let isoScheduledTime = null;
    if (scheduledTime) {
        const d = new Date(scheduledTime);
        if (!isNaN(d.getTime()) && d.getTime() > Date.now()) {
            isoScheduledTime = d.toISOString();
        }
    }

    // Step 1: Initiate Resumable Upload Session
    const initRes = await axios.post(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
            snippet: {
                title,
                description,
                tags: ["ParsuAI", "Shorts"],
                categoryId: "22"
            },
            status: {
                privacyStatus: isoScheduledTime ? "private" : "public",
                publishAt: isoScheduledTime || undefined,
                selfDeclaredMadeForKids: false
            }
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "X-Upload-Content-Length": videoBuffer.length,
                "X-Upload-Content-Type": "video/mp4"
            }
        }
    );

    const uploadUrl = initRes.headers.location;
    if (!uploadUrl) throw new Error("Failed to initialize YouTube video upload.");

    // Step 2: Stream Video Buffer to Resumable URL
    const uploadRes = await axios.put(uploadUrl, videoBuffer, {
        headers: {
            "Content-Type": "video/mp4",
            "Content-Length": videoBuffer.length
        }
    });

    const videoId = uploadRes.data?.id;
    return { 
        mediaId: videoId || "youtube_video", 
        postType: isoScheduledTime ? "scheduled_video" : "video",
        url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined,
        scheduledAt: isoScheduledTime
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL PUBLISHER ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Publishes media to one or multiple platforms
 * @param {Object} options
 * @param {string[]} options.platforms - Target platforms (e.g. ['instagram', 'facebook'] or ['all_connected'])
 * @param {Array<{url: string, name?: string, fileType?: string}>} options.mediaItems - Array of media objects
 * @param {string} options.caption - Caption text with emojis/tags
 * @param {string} options.postMode - "together" (carousel/album) or "separately" (individual posts)
 * @param {string|Date} [options.scheduledTime] - Optional scheduled future date/time
 * @param {string} options.userId - Authenticated user ID
 * @param {string} [options.messageId] - Optional message ID to save post results to
 */
export async function publishToSocialPlatforms({
    platforms = ["instagram"],
    mediaItems = [],
    caption = "",
    postMode = "together",
    scheduledTime = null,
    userId,
    messageId = null
}) {
    if (!userId) throw new Error("User ID is required for social publishing.");

    // Fetch all connected platforms for this user
    const userConnections = await SocialConnection.find({
        user: userId,
        isConnected: true
    }).select("+accessToken");

    const connectedMap = new Map();
    userConnections.forEach(conn => connectedMap.set(conn.platform.toLowerCase(), conn));

    // Resolve target platforms
    let targetPlatforms = [];
    if (platforms.includes("all_connected") || platforms.includes("all")) {
        targetPlatforms = Array.from(connectedMap.keys());
        if (targetPlatforms.length === 0) {
            return {
                success: false,
                summary: "No social media accounts are connected yet. Please visit the Social Hub (/social-connections) to connect your accounts."
            };
        }
    } else {
        targetPlatforms = platforms.map(p => p.toLowerCase());
    }

    const results = {
        successful: [],
        failed: [],
        notConnected: []
    };

    for (const platform of targetPlatforms) {
        const connection = connectedMap.get(platform);
        if (!connection || !connection.accessToken) {
            results.notConnected.push({
                platform,
                message: `The ${platform} account is not connected, so couldn't post to it. Please connect your ${platform} account in Social Hub (/social-connections).`
            });
            continue;
        }

        try {
            let resData = null;
            if (platform === "instagram") {
                resData = await publishToInstagram(mediaItems, caption, connection, postMode);
            } else if (platform === "facebook") {
                resData = await publishToFacebook(mediaItems, caption, connection, postMode);
            } else if (platform === "twitter") {
                resData = await publishToTwitter(mediaItems, caption, connection, postMode);
            } else if (platform === "linkedin") {
                resData = await publishToLinkedIn(mediaItems, caption, connection);
            } else if (platform === "pinterest") {
                resData = await publishToPinterest(mediaItems, caption, connection);
            } else if (platform === "youtube") {
                resData = await publishToYouTube(mediaItems, caption, connection, scheduledTime);
            } else {
                throw new Error(`Direct publishing to ${platform} is in progress.`);
            }

            const liveUrl = resData.url || (
                platform === "youtube" ? `https://www.youtube.com/watch?v=${resData.mediaId}`
                : platform === "twitter" ? `https://x.com/i/status/${resData.mediaId}`
                : platform === "facebook" ? `https://www.facebook.com/${resData.mediaId}`
                : platform === "linkedin" ? `https://www.linkedin.com/feed/update/${resData.mediaId}`
                : platform === "pinterest" ? `https://www.pinterest.com/pin/${resData.mediaId}`
                : null
            );

            results.successful.push({
                platform,
                mediaId: resData.mediaId,
                postType: resData.postType || postMode,
                url: liveUrl,
                scheduledAt: resData.scheduledAt || null,
                message: `Successfully posted to ${platform}!`
            });

            // Save post history on message
            if (messageId) {
                try {
                    await messageModel.findByIdAndUpdate(messageId, {
                        $push: {
                            socialPosts: {
                                platform,
                                mediaId: resData.mediaId,
                                postType: resData.postType || postMode,
                                caption: caption.slice(0, 300),
                                postedAt: new Date()
                            }
                        }
                    });
                } catch (e) {
                    console.warn("Could not append socialPost to message:", e.message);
                }
            }
        } catch (err) {
            console.error(`❌ Failed publishing to ${platform}:`, err.message);
            results.failed.push({
                platform,
                error: err.message
            });
        }
    }

    return results;
}
