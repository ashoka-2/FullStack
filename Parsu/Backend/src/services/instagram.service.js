import axios from "axios";

/**
 * Publishes an image or video (Reel) to Instagram via the Graph API.
 * Supports direct Instagram tokens as well as Facebook Page Graph tokens.
 */
export async function postMediaToInstagram(mediaUrl, caption, credentials, options = {}) {
    const { accessToken, userId } = credentials;
    const FB_GRAPH_VER = "v19.0";
    const IG_GRAPH_VER = "v21.0"; 

    if (!accessToken) throw new Error("No Access Token provided.");

    // Detect if media is video
    const isVideo = options.isVideo || 
        mediaUrl.includes("/perplexity/videos") || 
        /\.(mp4|mov|webm|m4v|ogg)(\?|$)/i.test(mediaUrl);

    try {
        const cleanToken = accessToken.trim();
        const cleanUserId = userId.trim();

        let resultMediaId = null;
        console.log(`📸 [IG-Service] Posting ${isVideo ? 'VIDEO (REELS)' : 'IMAGE'} -> "${mediaUrl}"`);

        // --- Container Creation Payload ---
        const containerPayload = {
            caption: caption,
            access_token: cleanToken
        };

        if (isVideo) {
            containerPayload.media_type = "REELS";
            containerPayload.video_url = mediaUrl;
        } else {
            containerPayload.image_url = mediaUrl;
        }

        // --- MODE 1: Direct Instagram Graph API ---
        try {
            console.log("📨 Mode: Direct Instagram API (graph.instagram.com)");
            
            const igResponse = await axios.post(
                `https://graph.instagram.com/${IG_GRAPH_VER}/${cleanUserId}/media`,
                containerPayload
            );
            resultMediaId = igResponse.data.id;
        } catch (igErr) {
            console.warn("⚠️ Mode: Direct Instagram API failed.");
            if (igErr.response?.data?.error) {
                console.warn("   [IG Error] " + JSON.stringify(igErr.response.data.error));
            }

            // IG tokens cannot be parsed by FB Graph. Do not fallback.
            if (cleanToken.startsWith("IG")) {
                throw new Error(`Instagram API Media Creation Failed: ${igErr.response?.data?.error?.message || igErr.message}`);
            }
            
            console.warn("⚠️ Trying Facebook Graph Fallback...");
            // --- MODE 2: Facebook Graph API Fallback ---
            const fbResponse = await axios.post(
                `https://graph.facebook.com/${FB_GRAPH_VER}/${cleanUserId}/media`,
                containerPayload
            );
            resultMediaId = fbResponse.data.id;
        }

        if (!resultMediaId) throw new Error("Could not create media container in any mode.");

        // Wait cycle (Crucial for CDN processing & video encoding)
        if (isVideo) {
            console.log("⏳ Waiting for video encoding on Instagram (polling container status)...");
            let isReady = false;
            let attempts = 0;
            const maxAttempts = 15; // up to ~45 seconds

            while (!isReady && attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 3000));
                attempts++;
                try {
                    const statusRes = await axios.get(
                        `https://graph.instagram.com/${IG_GRAPH_VER}/${resultMediaId}`,
                        {
                            params: {
                                fields: "status_code,status",
                                access_token: cleanToken
                            }
                        }
                    );
                    const statusCode = statusRes.data?.status_code;
                    console.log(`   [IG Video Status] Attempt ${attempts}: ${statusCode}`);
                    if (statusCode === "FINISHED") {
                        isReady = true;
                    } else if (statusCode === "ERROR" || statusCode === "EXPIRED") {
                        throw new Error(`Instagram video processing failed with status: ${statusCode}`);
                    }
                } catch (statusErr) {
                    if (statusErr.message.includes("Instagram video processing failed")) throw statusErr;
                    // Fallback to waiting if status check fails on certain endpoints
                    if (attempts >= 4) isReady = true;
                }
            }
        } else {
            console.log("⏳ Processing container (5s wait)...");
            await new Promise(r => setTimeout(r, 5000));
        }

        // Final Publish (Standard Publish endpoint)
        console.log("🚀 Final Publishing...");
        let publishRes;
        try {
            // Try publishing on Instagram Graph
            publishRes = await axios.post(
                `https://graph.instagram.com/${IG_GRAPH_VER}/${cleanUserId}/media_publish`,
                {
                    creation_id: resultMediaId,
                    access_token: cleanToken
                }
            );
        } catch (e) {
            // Fallback to Facebook Graph Publish
            publishRes = await axios.post(
                `https://graph.facebook.com/${FB_GRAPH_VER}/${cleanUserId}/media_publish`,
                {
                    creation_id: resultMediaId,
                    access_token: cleanToken
                }
            );
        }

        console.log("🎉 Successfully Published! ID:", publishRes.data.id);
        return publishRes.data.id;

    } catch (error) {
        const errorData = error.response?.data?.error || {};
        console.error("❌ Instagram Ultimate Error:", JSON.stringify(errorData, null, 2));
        
        throw new Error(`IG API Fail: ${errorData.message || error.message}`);
    }
}

// Backward compatibility alias for images
export async function postImageToInstagram(imageUrl, caption, credentials) {
    return postMediaToInstagram(imageUrl, caption, credentials, { isVideo: false });
}
