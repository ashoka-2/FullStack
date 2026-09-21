import SocialConnection from "../models/social.model.js";
import messageModel from "../models/message.model.js";
import { postMediaToInstagram } from "../services/instagram.service.js";
import { publishToSocialPlatforms } from "../services/socialPublisher.service.js";
import { geminiChatPrimary } from "../services/ai/models.js";
import axios from "axios";

// ============================================================
// PLATFORM CONFIG — OAuth URLs, scopes, token exchange logic
// ============================================================
const PLATFORMS = {
    instagram: {
        name: "Instagram",
        authUrl: "https://www.instagram.com/oauth/authorize",
        tokenUrl: "https://api.instagram.com/oauth/access_token",
        longLivedTokenUrl: "https://graph.instagram.com/access_token",
        scopes: "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages",
        getProfile: async (accessToken) => {
            const res = await axios.get(`https://graph.instagram.com/v21.0/me?fields=id,username,profile_picture_url&access_token=${accessToken}`);
            return { id: res.data.id, username: res.data.username, picture: res.data.profile_picture_url || "" };
        }
    },
    facebook: {
        name: "Facebook",
        authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
        scopes: "pages_manage_posts,pages_read_engagement,publish_video",
        getProfile: async (accessToken) => {
            const res = await axios.get(`https://graph.facebook.com/v21.0/me?fields=id,name,picture.width(200)&access_token=${accessToken}`);
            return { id: res.data.id, username: res.data.name, picture: res.data.picture?.data?.url || "" };
        }
    },
    pinterest: {
        name: "Pinterest",
        authUrl: "https://www.pinterest.com/oauth/",
        tokenUrl: "https://api.pinterest.com/v5/oauth/token",
        scopes: "boards:read,pins:read,pins:write,boards:write",
        getProfile: async (accessToken) => {
            const res = await axios.get("https://api.pinterest.com/v5/user_account", {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return { id: res.data.username, username: res.data.username, picture: res.data.profile_image || "" };
        }
    },
    twitter: {
        name: "Twitter / X",
        authUrl: "https://twitter.com/i/oauth2/authorize",
        tokenUrl: "https://api.twitter.com/2/oauth2/token",
        scopes: "tweet.read tweet.write users.read offline.access",
        isPKCE: true,
        getProfile: async (accessToken) => {
            const res = await axios.get("https://api.twitter.com/2/users/me?user.fields=profile_image_url,username", {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return { id: res.data.data.id, username: res.data.data.username, picture: res.data.data.profile_image_url || "" };
        }
    },
    tiktok: {
        name: "TikTok",
        authUrl: "https://www.tiktok.com/v2/auth/authorize/",
        tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
        scopes: "user.info.basic,video.publish,video.upload",
        getProfile: async (accessToken) => {
            const res = await axios.get("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const user = res.data?.data?.user;
            return { id: user?.open_id || "", username: user?.display_name || "", picture: user?.avatar_url || "" };
        }
    },
    linkedin: {
        name: "LinkedIn",
        authUrl: "https://www.linkedin.com/oauth/v2/authorization",
        tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
        scopes: "openid profile w_member_social",
        getProfile: async (accessToken) => {
            const res = await axios.get("https://api.linkedin.com/v2/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return { id: res.data.sub, username: res.data.name, picture: res.data.picture || "" };
        }
    },
    youtube: {
        name: "YouTube",
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
        getProfile: async (accessToken) => {
            const res = await axios.get("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const ch = res.data.items?.[0];
            return { id: ch?.id || "", username: ch?.snippet?.title || "", picture: ch?.snippet?.thumbnails?.default?.url || "" };
        }
    }
};

// Map platform → env var keys
function getClientCredentials(platform) {
    const map = {
        instagram: { clientId: process.env.META_APP_ID, clientSecret: process.env.META_APP_SECRET, redirectUri: process.env.META_REDIRECT_URI },
        facebook: { clientId: process.env.META_APP_ID, clientSecret: process.env.META_APP_SECRET, redirectUri: process.env.FACEBOOK_REDIRECT_URI },
        pinterest: { clientId: process.env.PINTEREST_CLIENT_ID, clientSecret: process.env.PINTEREST_CLIENT_SECRET, redirectUri: process.env.PINTEREST_REDIRECT_URI },
        twitter: { clientId: process.env.TWITTER_CLIENT_ID, clientSecret: process.env.TWITTER_CLIENT_SECRET, redirectUri: process.env.TWITTER_REDIRECT_URI },
        tiktok: { clientId: process.env.TIKTOK_CLIENT_KEY, clientSecret: process.env.TIKTOK_CLIENT_SECRET, redirectUri: process.env.TIKTOK_REDIRECT_URI },
        linkedin: { clientId: process.env.LINKEDIN_CLIENT_ID, clientSecret: process.env.LINKEDIN_CLIENT_SECRET, redirectUri: process.env.LINKEDIN_REDIRECT_URI },
        youtube: { clientId: process.env.YOUTUBE_CLIENT_ID, clientSecret: process.env.YOUTUBE_CLIENT_SECRET, redirectUri: process.env.YOUTUBE_REDIRECT_URI }
    };
    return map[platform] || {};
}

// ============================================================
// CONTROLLERS
// ============================================================

/**
 * GET /api/social/accounts
 * List all connected social accounts for the logged-in user
 */
export async function getConnectedAccounts(req, res) {
    try {
        const connections = await SocialConnection.find({ user: req.user.id, isConnected: true });
        const accounts = connections.map(c => ({
            platform: c.platform,
            platformUserId: c.platformUserId,
            platformUsername: c.platformUsername,
            profilePicUrl: c.profilePicUrl,
            isConnected: c.isConnected,
            connectedAt: c.createdAt
        }));
        res.status(200).json({ success: true, accounts });
    } catch (error) {
        console.error("Get Connected Accounts Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch connected accounts" });
    }
}

/**
 * GET /api/social/connect/:platform
 * Generate and redirect to OAuth consent URL
 */
export async function startOAuthFlow(req, res) {
    try {
        const { platform } = req.params;
        const config = PLATFORMS[platform];
        if (!config) return res.status(400).json({ success: false, message: `Unsupported platform: ${platform}` });

        const creds = getClientCredentials(platform);
        if (!creds.clientId) return res.status(400).json({ success: false, message: `${config.name} is not configured. Missing API keys in .env` });

        // Build OAuth state (JWT-like: userId + platform + timestamp)
        const state = Buffer.from(JSON.stringify({
            userId: req.user.id,
            platform,
            ts: Date.now()
        })).toString("base64url");

        let authUrl;

        if (platform === "tiktok") {
            // TikTok uses client_key instead of client_id
            authUrl = `${config.authUrl}?client_key=${creds.clientId}&scope=${config.scopes}&response_type=code&redirect_uri=${encodeURIComponent(creds.redirectUri)}&state=${state}`;
        } else if (platform === "twitter") {
            // Twitter uses PKCE
            const codeChallenge = state; // Simplified; in prod use proper PKCE
            authUrl = `${config.authUrl}?response_type=code&client_id=${creds.clientId}&redirect_uri=${encodeURIComponent(creds.redirectUri)}&scope=${encodeURIComponent(config.scopes)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`;
        } else if (platform === "pinterest") {
            authUrl = `${config.authUrl}?client_id=${creds.clientId}&redirect_uri=${encodeURIComponent(creds.redirectUri)}&response_type=code&scope=${config.scopes}&state=${state}`;
        } else {
            authUrl = `${config.authUrl}?client_id=${creds.clientId}&redirect_uri=${encodeURIComponent(creds.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scopes)}&state=${state}`;
        }

        // For YouTube, add access_type for refresh token
        if (platform === "youtube") {
            authUrl += "&access_type=offline&prompt=consent";
        }

        res.status(200).json({ success: true, authUrl });
    } catch (error) {
        console.error("Start OAuth Flow Error:", error);
        res.status(500).json({ success: false, message: "Failed to start OAuth flow" });
    }
}

/**
 * GET /api/social/callback/:platform
 * Handle OAuth callback — exchange code for tokens, save connection
 */
export async function handleOAuthCallback(req, res) {
    try {
        const { platform } = req.params;
        const { code, state } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        if (!code || !state) {
            return res.redirect(`${frontendUrl}/social-connections?error=missing_code`);
        }

        // Decode state
        let stateData;
        try {
            stateData = JSON.parse(Buffer.from(state, "base64url").toString());
        } catch {
            return res.redirect(`${frontendUrl}/social-connections?error=invalid_state`);
        }

        // Check timestamp (10 minute expiry)
        if (Date.now() - stateData.ts > 10 * 60 * 1000) {
            return res.redirect(`${frontendUrl}/social-connections?error=expired`);
        }

        const config = PLATFORMS[platform];
        const creds = getClientCredentials(platform);

        if (!config || !creds.clientId) {
            return res.redirect(`${frontendUrl}/social-connections?error=unsupported`);
        }

        // Exchange code for token
        let tokenData;
        try {
            tokenData = await exchangeCodeForToken(platform, code, creds, config);
        } catch (err) {
            console.error(`Token exchange failed for ${platform}:`, err.response?.data || err.message);
            return res.redirect(`${frontendUrl}/social-connections?error=token_exchange_failed`);
        }

        // Get profile info
        let profile = { id: "unknown", username: "Unknown", picture: "" };
        try {
            profile = await config.getProfile(tokenData.accessToken);
        } catch (err) {
            console.error(`Profile fetch failed for ${platform}:`, err.response?.data || err.message);
        }

        // Upsert social connection
        await SocialConnection.findOneAndUpdate(
            { user: stateData.userId, platform },
            {
                platformUserId: profile.id,
                platformUsername: profile.username,
                profilePicUrl: profile.picture,
                accessToken: tokenData.accessToken,
                refreshToken: tokenData.refreshToken || "",
                tokenExpiresAt: tokenData.expiresIn ? new Date(Date.now() + tokenData.expiresIn * 1000) : null,
                scopes: config.scopes.split(/[,\s]+/),
                isConnected: true,
                meta: tokenData.meta || {}
            },
            { upsert: true, new: true }
        );

        res.redirect(`${frontendUrl}/social-connections?connected=${platform}`);
    } catch (error) {
        console.error("OAuth Callback Error:", error);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        res.redirect(`${frontendUrl}/social-connections?error=server_error`);
    }
}

/**
 * DELETE /api/social/accounts/:platform
 * Disconnect a social account
 */
export async function disconnectAccount(req, res) {
    try {
        const { platform } = req.params;
        const result = await SocialConnection.findOneAndDelete({ user: req.user.id, platform });
        if (!result) {
            return res.status(404).json({ success: false, message: "Connection not found" });
        }
        res.status(200).json({ success: true, message: `${platform} disconnected successfully` });
    } catch (error) {
        console.error("Disconnect Account Error:", error);
        res.status(500).json({ success: false, message: "Failed to disconnect account" });
    }
}

/**
 * POST /api/social/connect-manual
 * Manual token connection (for platforms that don't support full OAuth in dev)
 */
export async function connectManual(req, res) {
    try {
        const { platform, accessToken, userId, username } = req.body;

        if (!platform || !accessToken || !userId) {
            return res.status(400).json({ success: false, message: "platform, accessToken, and userId are required" });
        }

        if (!PLATFORMS[platform]) {
            return res.status(400).json({ success: false, message: `Unsupported platform: ${platform}` });
        }

        await SocialConnection.findOneAndUpdate(
            { user: req.user.id, platform },
            {
                platformUserId: userId,
                platformUsername: username || "",
                accessToken,
                isConnected: true
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, message: `${platform} connected manually` });
    } catch (error) {
        console.error("Manual Connect Error:", error);
        res.status(500).json({ success: false, message: "Failed to connect account" });
    }
}

// ============================================================
// TOKEN EXCHANGE HELPERS (platform-specific)
// ============================================================
async function exchangeCodeForToken(platform, code, creds, config) {
    let accessToken, refreshToken, expiresIn, meta = {};

    if (platform === "instagram") {
        // Step 1: Short-lived token
        const formData = new URLSearchParams({
            client_id: creds.clientId,
            client_secret: creds.clientSecret,
            grant_type: "authorization_code",
            redirect_uri: creds.redirectUri,
            code
        });
        const shortRes = await axios.post(config.tokenUrl, formData.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        const shortToken = shortRes.data.access_token;

        // Step 2: Exchange for long-lived token
        const longRes = await axios.get(`${config.longLivedTokenUrl}?grant_type=ig_exchange_token&client_secret=${creds.clientSecret}&access_token=${shortToken}`);
        accessToken = longRes.data.access_token;
        expiresIn = longRes.data.expires_in || 5184000; // 60 days
    } else if (platform === "pinterest") {
        const authHeader = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
        const res = await axios.post(config.tokenUrl, {
            grant_type: "authorization_code",
            code,
            redirect_uri: creds.redirectUri
        }, { headers: { Authorization: `Basic ${authHeader}`, "Content-Type": "application/json" } });
        accessToken = res.data.access_token;
        refreshToken = res.data.refresh_token;
        expiresIn = res.data.expires_in;
    } else if (platform === "twitter") {
        const authHeader = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
        const formData = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: creds.redirectUri,
            code_verifier: req?.query?.state || "challenge" // PKCE
        });
        const res = await axios.post(config.tokenUrl, formData.toString(), {
            headers: { Authorization: `Basic ${authHeader}`, "Content-Type": "application/x-www-form-urlencoded" }
        });
        accessToken = res.data.access_token;
        refreshToken = res.data.refresh_token;
        expiresIn = res.data.expires_in;
    } else if (platform === "tiktok") {
        const res = await axios.post(config.tokenUrl, {
            client_key: creds.clientId,
            client_secret: creds.clientSecret,
            grant_type: "authorization_code",
            code,
            redirect_uri: creds.redirectUri
        }, { headers: { "Content-Type": "application/json" } });
        accessToken = res.data.access_token;
        refreshToken = res.data.refresh_token;
        expiresIn = res.data.expires_in;
        meta = { open_id: res.data.open_id };
    } else {
        // Generic OAuth2 (Facebook, LinkedIn, YouTube)
        const params = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: creds.redirectUri,
            client_id: creds.clientId,
            client_secret: creds.clientSecret
        });
        const res = await axios.post(config.tokenUrl, params.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        accessToken = res.data.access_token;
        refreshToken = res.data.refresh_token;
        expiresIn = res.data.expires_in;
    }

    return { accessToken, refreshToken, expiresIn, meta };
}

/**
 * POST /api/social/publish
 * Publishes images or videos to one or multiple connected social accounts
 */
export async function publishContent(req, res) {
    try {
        const { platform, platforms, mediaUrl, mediaUrls, caption, messageId, postMode = "together" } = req.body;
        const userId = req.user.id || req.user._id;

        // Resolve media items
        let resolvedMediaItems = [];
        if (mediaUrls && Array.isArray(mediaUrls) && mediaUrls.length > 0) {
            resolvedMediaItems = mediaUrls.map(u => typeof u === 'string' ? { url: u } : u);
        } else if (mediaUrl) {
            resolvedMediaItems = [{ url: mediaUrl }];
        }

        if (resolvedMediaItems.length === 0) {
            return res.status(400).json({ message: "At least one media item (mediaUrl or mediaUrls) is required." });
        }

        const targetPlatforms = platforms || (platform ? [platform] : ["instagram"]);

        const results = await publishToSocialPlatforms({
            platforms: targetPlatforms,
            mediaItems: resolvedMediaItems,
            caption: caption || "Shared via Perplexity AI 🚀",
            postMode,
            userId,
            messageId
        });

        if (results.successful?.length > 0) {
            return res.json({
                success: true,
                message: results.successful.map(s => s.message).join(" "),
                results
            });
        } else if (results.notConnected?.length > 0) {
            return res.status(200).json({
                success: false,
                notConnected: true,
                message: results.notConnected[0].message,
                results
            });
        } else {
            return res.status(200).json({
                success: false,
                message: results.failed?.[0]?.error || "Failed to publish content",
                results
            });
        }
    } catch (err) {
        console.error("Publish error:", err);
        return res.status(500).json({ message: err.message || "Failed to publish content" });
    }
}

/**
 * POST /api/social/generate-caption
 * AI Generates engaging, platform-tailored social media captions with hashtags and emojis
 */
export async function generateCaption(req, res) {
    try {
        const { mediaUrl, mediaUrls, context, platform = "social media", tone = "engaging" } = req.body;
        
        const mediaList = mediaUrls && mediaUrls.length > 0 ? mediaUrls.join(", ") : (mediaUrl || "");

        const prompt = `You are an expert social media creator. Write an engaging, viral post caption for ${platform}.
Guidelines:
- Tone: ${tone}
- Include 3-6 relevant, high-traffic hashtags
- Include 2-4 tasteful emojis
- Keep it concise, natural, and compelling
${context ? `Post context / user idea: "${context}"` : ""}
${mediaList ? `Media attached: ${mediaList}` : ""}
Return ONLY the ready-to-post caption text, without any quotes, markdown headers, or surrounding text.`;

        let caption = "";
        try {
            const response = await geminiChatPrimary.invoke(prompt);
            caption = response?.content ? response.content.trim() : "";
        } catch (geminiErr) {
            console.warn("Gemini caption invoke fallback:", geminiErr.message);
        }

        if (!caption) {
            caption = context 
                ? `${context} ✨🚀 #trending #fyp #creator` 
                : "Excited to share this with everyone! ✨🚀 Let me know what you think in the comments! #trending #viral #fyp";
        }

        return res.json({ success: true, caption });
    } catch (err) {
        console.error("Caption generation error:", err);
        return res.status(500).json({ success: false, message: err.message || "Failed to generate caption" });
    }
}
