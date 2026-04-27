import express, { Router } from "express";
import multer from "multer";
import { authenticateSeller } from "../middlewares/auth.middleware.js";
import { createProduct, getAllProducts, getSellersAllProducts, getProductMetadata, deleteProduct, updateProduct, getProductById } from "../controllers/product.controller.js";
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
    upload.array("images", 7),
    createProductValidator as any,
    createProduct as any
);

router.get("/all", getAllProducts as any);
router.get("/sellers-all", authenticateSeller as any, getSellersAllProducts as any);
router.get("/metadata", getProductMetadata as any);
router.get("/:id", getProductById as any);

router.put("/update/:id", authenticateSeller as any, upload.array("images", 7), updateProduct as any);
router.delete("/delete/:id", authenticateSeller as any, deleteProduct as any);

export default router;