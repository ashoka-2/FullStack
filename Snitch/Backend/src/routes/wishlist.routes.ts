import express, { Router } from "express";
import { verifyToken, authenticateSeller } from "../middlewares/auth.middleware.js";
import { getWishlist, toggleWishlist, getAllWishlists } from "../controllers/wishlist.controller.js";

const router: Router = express.Router();

router.use(verifyToken as any);

router.get("/", getWishlist as any);
router.post("/toggle", toggleWishlist as any);
router.get("/all", authenticateSeller as any, getAllWishlists as any);

export default router;
