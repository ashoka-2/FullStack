import express, { Router } from "express";
import multer from "multer";
import { authenticateAdmin } from "../middlewares/auth.middleware.js";
import {
    createCategory, getAllCategories, updateCategory, deleteCategory,
    createUnit, getAllUnits, updateUnit, deleteUnit,
    createSize, getAllSizes, updateSize, deleteSize,
    createColor, getAllColors, updateColor, deleteColor,
    createBrand, getAllBrands, updateBrand, deleteBrand,
} from "../controllers/admin.controller.js";
import { adminValidator } from "../validator/admin.validator.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },   // 5 MB
});

const router: Router = express.Router();

// All admin routes are protected by authenticateAdmin
router.use(authenticateAdmin as any);

// ── Categories ──────────────────────────────────────────────────────────────
router.post("/categories", upload.single("image"), adminValidator("category"), createCategory as any);
router.get("/categories", getAllCategories as any);
router.put("/categories/:id", upload.single("image"), updateCategory as any);
router.delete("/categories/:id", deleteCategory as any);

// ── Units ───────────────────────────────────────────────────────────────────
router.post("/units", adminValidator("unit"), createUnit as any);
router.get("/units", getAllUnits as any);
router.put("/units/:id", updateUnit as any);
router.delete("/units/:id", deleteUnit as any);

// ── Sizes ───────────────────────────────────────────────────────────────────
router.post("/sizes", adminValidator("size"), createSize as any);
router.get("/sizes", getAllSizes as any);
router.put("/sizes/:id", updateSize as any);
router.delete("/sizes/:id", deleteSize as any);

// ── Colors ──────────────────────────────────────────────────────────────────
router.post("/colors", adminValidator("color"), createColor as any);
router.get("/colors", getAllColors as any);
router.put("/colors/:id", updateColor as any);
router.delete("/colors/:id", deleteColor as any);

// ── Brands ──────────────────────────────────────────────────────────────────
router.post("/brands", upload.single("logo"), adminValidator("brand"), createBrand as any);
router.get("/brands", getAllBrands as any);
router.put("/brands/:id", upload.single("logo"), updateBrand as any);
router.delete("/brands/:id", deleteBrand as any);

export default router;
