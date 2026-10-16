import express from "express";
import axios from "axios";
import { searchWebImages } from "../services/imageSearch.service.js";
import { authUser } from "../middlewares/auth.middleware.js";
import userModel from "../models/user.model.js";
import { decryptKey } from "../utils/encryption.utils.js";

const router = express.Router();

async function getFreeOpenRouterImageModels(apiKey) {
    const response = await axios.get("https://openrouter.ai/api/v1/images/models", {
        headers: { Authorization: `Bearer ${apiKey}` }, timeout: 12000
    });
    const models = Array.isArray(response.data?.data) ? response.data.data : [];
    const imageModels = models.filter(model => model.architecture?.output_modalities?.includes("image")).slice(0, 24);
    const checks = await Promise.allSettled(imageModels.map(async model => {
        const endpoints = await axios.get(`https://openrouter.ai/api/v1/images/models/${model.id}/endpoints`, {
            headers: { Authorization: `Bearer ${apiKey}` }, timeout: 8000
        });
        const records = endpoints.data?.data?.endpoints || endpoints.data?.endpoints || [];
        const free = records.some(endpoint => {
            const prices = Object.values(endpoint.pricing || {}).map(Number).filter(Number.isFinite);
            return prices.length > 0 && prices.every(price => price === 0);
        });
        return free ? { id: model.id, name: model.name || model.id } : null;
    }));
    return checks.filter(result => result.status === "fulfilled" && result.value).map(result => result.value);
}

async function getUserOpenRouterKey(userId) {
    const user = await userModel.findById(userId).select("+customApiKeys.apiKey");
    const entry = user?.customApiKeys?.find(key => key.provider === "openrouter" && key.isActive !== false && key.apiKey);
    return entry?.apiKey ? decryptKey(entry.apiKey) : null;
}

router.get("/image-models", authUser, async (req, res) => {
    try {
        const apiKey = await getUserOpenRouterKey(req.user.id);
        if (!apiKey) return res.json({ success: true, models: [], reason: "Connect an OpenRouter key to check for free image models." });
        const models = await getFreeOpenRouterImageModels(apiKey);
        res.json({ success: true, models });
    } catch (err) {
        console.warn("Image model discovery failed:", err.message);
        res.status(502).json({ success: false, message: "Could not check image model availability." });
    }
});

router.post("/generate-image", authUser, async (req, res) => {
    try {
        const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim().slice(0, 2000) : "";
        const model = typeof req.body?.model === "string" ? req.body.model : "";
        if (!prompt || !model) return res.status(400).json({ success: false, message: "A prompt and image model are required." });
        const apiKey = await getUserOpenRouterKey(req.user.id);
        if (!apiKey) return res.status(409).json({ success: false, message: "Connect an OpenRouter key with an available free image model first." });
        const freeModels = await getFreeOpenRouterImageModels(apiKey);
        if (!freeModels.some(item => item.id === model)) {
            return res.status(403).json({ success: false, message: "This model is not confirmed as free and available for image generation." });
        }
        const response = await axios.post("https://openrouter.ai/api/v1/images", { model, prompt }, {
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, timeout: 120000,
            maxContentLength: 20 * 1024 * 1024
        });
        const image = response.data?.data?.[0];
        if (!image?.b64_json) return res.status(502).json({ success: false, message: "The image provider returned no image." });
        res.json({ success: true, image: image.b64_json, mimeType: image.media_type || "image/png", model, cost: response.data?.usage?.cost ?? null });
    } catch (err) {
        console.error("Image generation failed:", err.response?.status || err.code || "provider error");
        res.status(502).json({ success: false, message: "Image generation failed. Check the key and model availability, then try again." });
    }
});

/**
 * GET /api/media/images?q=...&limit=...
 * Search web images for chat galleries, products, and travel places
 */
router.get("/images", authUser, async (req, res) => {
    try {
        const query = req.query.q || req.query.query;
        if (typeof query !== "string" || !query.trim() || query.length > 180) {
            return res.status(400).json({ success: false, message: "Query parameter 'q' is required" });
        }
        const requestedLimit = Number.parseInt(req.query.limit, 10) || 6;
        const limit = Math.min(Math.max(requestedLimit, 1), 10);
        const images = await searchWebImages(query, limit);
        res.json({ success: true, query, images });
    } catch (err) {
        console.error("Media image search error:", err);
        res.status(500).json({ success: false, message: "Failed to search images" });
    }
});

export default router;
