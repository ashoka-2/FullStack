import api from '../../../utils/axios.js';

export async function getConnectedAccounts() {
    const response = await api.get("/api/social/accounts");
    return response.data;
}

export async function disconnectAccount(platform) {
    const response = await api.delete(`/api/social/accounts/${platform}`);
    return response.data;
}

export async function getOAuthUrl(platform) {
    const response = await api.get(`/api/social/connect/${platform}`);
    return response.data;
}

export async function connectManual({ platform, accessToken, userId, username }) {
    const response = await api.post("/api/social/connect-manual", { platform, accessToken, userId, username });
    return response.data;
}

export async function publishMedia({ platform, platforms, mediaUrl, mediaUrls, caption, messageId, postMode = "together", isVideo }) {
    const response = await api.post("/api/social/publish", { 
        platform, 
        platforms: platforms || (platform ? [platform] : ["instagram"]),
        mediaUrl, 
        mediaUrls: mediaUrls || (mediaUrl ? [mediaUrl] : []),
        caption, 
        messageId, 
        postMode, 
        isVideo 
    });
    return response.data;
}

export async function generateCaption({ mediaUrl, mediaUrls, context, platform, tone }) {
    const response = await api.post("/api/social/generate-caption", {
        mediaUrl,
        mediaUrls,
        context,
        platform,
        tone
    });
    return response.data;
}
