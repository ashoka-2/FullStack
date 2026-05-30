import express, { Router } from "express";
import { verifyToken, authenticateSeller } from "../middlewares/auth.middleware.js";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart, getAllCarts } from "../controllers/cart.controller.js";

const router: Router = express.Router();

router.use(verifyToken as any);

router.get("/", getCart as any);
router.post("/add", addToCart as any);
router.put("/update", updateCartItem as any);
router.delete("/remove/:itemId", removeFromCart as any);
router.delete("/clear", clearCart as any);
router.get("/all", authenticateSeller as any, getAllCarts as any);

export default router;
