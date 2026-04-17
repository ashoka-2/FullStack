import express, { Router } from "express";
import multer from "multer";
import { authenticateSeller } from "../middlewares/auth.middleware.js";
import { createProduct, getAllProducts,getSellersAllProducts } from "../controllers/product.controller.js";
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
    authenticateSeller,
    upload.array("images", 7),
    createProductValidator,
    createProduct
);

router.get("/all",getAllProducts)
router.get("/sellers-all",authenticateSeller,getSellersAllProducts)

export default router;