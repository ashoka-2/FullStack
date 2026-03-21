import axios from "axios";

/**
 * Universal Instagram Content Publishing Service
 * Handles both:
 * 1. Facebook Graph API (Standard/Legacy)
 * 2. Instagram Professional API (New/Direct)
 */
export async function postImageToInstagram(imageUrl, caption, credentials) {
    const { accessToken, userId } = credentials;
    const FB_GRAPH_VER = "v19.0";
    const IG_GRAPH_VER = "v21.0"; // New official IG API version

    if (!accessToken) throw new Error("No Access Token provided.");

    try {
        const cleanToken = accessToken.trim();
        const cleanUserId = userId.trim();

        // STRICT TOKEN DEBUGGING
        console.log("==========================================");
        console.log(`🔍 [IG-Service] Token Type:`, typeof cleanToken);
        console.log(`🔍 [IG-Service] Token Length:`, cleanToken.length);
        console.log(`🔍 [IG-Service] Token Starts With:`, cleanToken.substring(0, 15) + "...");
        console.log(`🔍 [IG-Service] Target ID: ${cleanUserId}`);
        console.log("==========================================");

        let resultMediaId = null;

        console.log(`📸 [IG-Service] EXACT IMAGE URL BEING SENT: "${imageUrl}"`);

        // --- MODE 1: Direct Instagram Graph API ---
        try {
            console.log("📨 Mode: Direct Instagram API (graph.instagram.com)");
            
            const igResponse = await axios.post(
                `https://graph.instagram.com/${IG_GRAPH_VER}/${cleanUserId}/media`,
                {
                    image_url: imageUrl, // Transformed URL from instagram.tool.js
                    caption: caption,
                    access_token: cleanToken
                }
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
                {
                    image_url: imageUrl,
                    caption: caption,
                    access_token: cleanToken
                }
            );
            resultMediaId = fbResponse.data.id;
        }

        if (!resultMediaId) throw new Error("Could not create media container in any mode.");

        // Wait cycle (Crucial for CDN processing)
        console.log("⏳ Processing container (10s wait)...");
        await new Promise(r => setTimeout(r, 10000));

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
