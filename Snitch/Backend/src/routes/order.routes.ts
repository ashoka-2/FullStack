import express, { Router } from "express";
import { verifyToken, authenticateSeller } from "../middlewares/auth.middleware.js";
import { createOrder, getMyOrders, getAllOrders, updateOrderStatus } from "../controllers/order.controller.js";

const router: Router = express.Router();

router.use(verifyToken as any);

router.post("/create", createOrder as any);
router.get("/my", getMyOrders as any);
router.get("/all", authenticateSeller as any, getAllOrders as any);
router.put("/status/:id", authenticateSeller as any, updateOrderStatus as any);

export default router;
