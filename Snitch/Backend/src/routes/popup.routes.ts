import express, { Router } from "express";
import multer from "multer";
import { authenticateAdmin } from "../middlewares/auth.middleware.js";
import {
    getActivePopups,
    getPopups,
    createPopup,
    updatePopup,
    deletePopup,
    togglePopupStatus
} from "../controllers/popup.controller.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10 MB limit for file
        fieldSize: 25 * 1024 * 1024 // 25 MB limit for text fields (stringified base64)
    },
});

const router: Router = express.Router();

// Public route to get active popups for buyers/sellers
router.get("/active", getActivePopups as any);

// Protected admin-only routes
router.get("/", authenticateAdmin as any, getPopups as any);
router.post("/", authenticateAdmin as any, upload.single("image"), createPopup as any);
router.put("/:id", authenticateAdmin as any, upload.single("image"), updatePopup as any);
router.delete("/:id", authenticateAdmin as any, deletePopup as any);
router.patch("/:id/toggle", authenticateAdmin as any, togglePopupStatus as any);

export default router;
