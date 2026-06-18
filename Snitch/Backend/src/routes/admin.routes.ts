import express, { Router } from "express";
import multer from "multer";
import { authenticateAdmin } from "../middlewares/auth.middleware.js";
import {
    createCategory, getAllCategories, updateCategory, deleteCategory,
    createUnit, getAllUnits, updateUnit, deleteUnit,
    createSize, getAllSizes, updateSize, deleteSize,
    createColor, getAllColors, updateColor, deleteColor,
    createBrand, getAllBrands, updateBrand, deleteBrand,
    createPattern, getAllPatterns, updatePattern, deletePattern,
    createFit, getAllFits, updateFit, deleteFit,
    createMaterial, getAllMaterials, updateMaterial, deleteMaterial,
    createCollar, getAllCollars, updateCollar, deleteCollar,
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
router.get("/colors", getAllColors as any);

// ── Brands ──────────────────────────────────────────────────────────────────
router.post("/brands", upload.single("logo"), adminValidator("brand"), createBrand as any);
router.get("/brands", getAllBrands as any);
router.put("/brands/:id", upload.single("logo"), updateBrand as any);
router.delete("/brands/:id", deleteBrand as any);

// ── Patterns ─────────────────────────────────────────────────────────────────
router.post("/patterns", createPattern as any);
router.get("/patterns", getAllPatterns as any);
router.put("/patterns/:id", updatePattern as any);
router.delete("/patterns/:id", deletePattern as any);

// ── Fits ─────────────────────────────────────────────────────────────────────
router.post("/fits", createFit as any);
router.get("/fits", getAllFits as any);
router.put("/fits/:id", updateFit as any);
router.delete("/fits/:id", deleteFit as any);

// ── Materials ─────────────────────────────────────────────────────────────────
router.post("/materials", createMaterial as any);
router.get("/materials", getAllMaterials as any);
router.put("/materials/:id", updateMaterial as any);
router.delete("/materials/:id", deleteMaterial as any);

// ── Collars ───────────────────────────────────────────────────────────────────
router.post("/collars", createCollar as any);
router.get("/collars", getAllCollars as any);
router.put("/collars/:id", updateCollar as any);
router.delete("/collars/:id", deleteCollar as any);

export default router;
