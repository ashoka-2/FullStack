import axios from "axios";


export async function postImageToInstagram(imageUrl, caption, credentials) {
    const { accessToken, userId } = credentials;

    // Check kar rahe hain ki image ImageKit ki hai ya nahi (Instagram requirements)
    if (!imageUrl || !imageUrl.includes("ik.imagekit.io")) {
        throw new Error("Invalid image_url: Must be a valid ik.imagekit.io link.");
    }

    // Access token aur User ID check kar rahe hain validation ke liye
    if (!accessToken || !userId) {
        throw new Error("Instagram Account not connected. Please connect your account in settings.");
    }

    try {
        // Step 1: Ek media container bana rahe hain Facebook Graph API use karke
        const containerUrl = `https://graph.facebook.com/v21.0/${userId}/media`;
        const containerResponse = await axios.post(containerUrl, {
            image_url: imageUrl,
            caption: caption,
            access_token: accessToken
        });

        const creationId = containerResponse.data.id;
        if (!creationId) {
            throw new Error("Failed to create Instagram media container.");
        }

        // Instagram ko image process karne mein thoda time lagta hai, isliye 8 seconds wait karenge
        console.log("Waiting for container to process...");
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Step 2: Media ko final publish kar rahe hain user ke profile pe
        const publishUrl = `https://graph.facebook.com/v21.0/${userId}/media_publish`;
        const publishResponse = await axios.post(publishUrl, {
            creation_id: creationId,
            access_token: accessToken
        });

        const mediaId = publishResponse.data.id;
        if (!mediaId) {
            throw new Error("Failed to publish Instagram media.");
        }

        return mediaId;
    } catch (error) {
        // Facebook/Instagram API se aane wale errors ko handle kar rahe hain
        console.error("Instagram API Error:", error.response?.data || error.message);
        const fbError = error.response?.data?.error?.message || error.message;
        throw new Error(`Instagram API Error: ${fbError}`);
    }
}
