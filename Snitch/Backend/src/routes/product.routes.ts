import express, { Router } from "express";
import multer from "multer";
import { authenticateSeller } from "../middlewares/auth.middleware.js";
import { createProduct, getAllProducts, getSellersAllProducts, getProductMetadata, deleteProduct, updateProduct, getProductById, createColor } from "../controllers/product.controller.js";
import {
    createCategory,
    createUnit,
    createSize,
    createBrand,
    createPattern,
    createFit,
    createMaterial,
    createCollar
} from "../controllers/admin.controller.js";
import { createProductValidator } from "../validator/product.validator.js";

// Setup Multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});

const router: Router = express.Router();


router.post(
    "/add",
    authenticateSeller as any,
    upload.any(),
    createProductValidator as any,
    createProduct as any
);

router.post(
    "/colors",
    authenticateSeller as any,
    createColor as any
);

router.get("/all", getAllProducts as any);
router.get("/sellers-all", authenticateSeller as any, getSellersAllProducts as any);
router.get("/metadata", getProductMetadata as any);
router.get("/:id", getProductById as any);

router.put("/update/:id", authenticateSeller as any, upload.any(), updateProduct as any);
router.delete("/delete/:id", authenticateSeller as any, deleteProduct as any);

// Seller Metadata Creation Routes
router.post("/categories", authenticateSeller as any, upload.single("image"), createCategory as any);
router.post("/brands", authenticateSeller as any, upload.single("logo"), createBrand as any);
router.post("/units", authenticateSeller as any, createUnit as any);
router.post("/sizes", authenticateSeller as any, createSize as any);
router.post("/patterns", authenticateSeller as any, createPattern as any);
router.post("/fits", authenticateSeller as any, createFit as any);
router.post("/materials", authenticateSeller as any, createMaterial as any);
router.post("/collars", authenticateSeller as any, createCollar as any);

export default router;