import express from "express";
import { searchWebImages } from "../services/imageSearch.service.js";

const router = express.Router();

/**
 * GET /api/media/images?q=...&limit=...
 * Search web images for chat galleries, products, and travel places
 */
router.get("/images", async (req, res) => {
    try {
        const query = req.query.q || req.query.query;
        if (!query) {
            return res.status(400).json({ success: false, message: "Query parameter 'q' is required" });
        }
        const limit = parseInt(req.query.limit, 10) || 6;
        const images = await searchWebImages(query, limit);
        res.json({ success: true, query, images });
    } catch (err) {
        console.error("Media image search error:", err);
        res.status(500).json({ success: false, message: "Failed to search images", error: err.message });
    }
});

export default router;
