import express from "express";
import { authUser, requireAdmin } from "../middlewares/auth.middleware.js";
import {
    createOrder,
    verifyPayment,
    getSubscriptionStatus,
    getPublicPlans,
    updateGatewayMode,
    updatePlanPricing,
    getAdminSubscribers
} from "../controllers/subscription.controller.js";

const router = express.Router();

// Public plan catalog with geo-detection
router.get("/plans", getPublicPlans);

// Authenticated user subscription operations
router.post("/create-order", authUser, createOrder);
router.post("/verify-payment", authUser, verifyPayment);
router.get("/me", authUser, getSubscriptionStatus);

// Admin-only subscription & gateway management
router.get("/admin/subscribers", authUser, requireAdmin, getAdminSubscribers);
router.put("/admin/gateway-mode", authUser, requireAdmin, updateGatewayMode);
router.put("/admin/plans", authUser, requireAdmin, updatePlanPricing);

export default router;
