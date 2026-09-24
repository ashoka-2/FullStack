import Razorpay from "razorpay";
import crypto from "crypto";
import userModel from "../models/user.model.js";
import redisClient, { isRedisReady } from "../config/redis.js";

// Multi-currency plan pricing catalog
// Subunits: INR in paise (₹1 = 100 paise), USD in cents ($1 = 100 cents)
export const DEFAULT_PLAN_PRICING = {
    INR: {
        symbol: "₹",
        free: {
            monthly: { amount: 0, display: 0, name: "Starter Free" },
            annual: { amount: 0, display: 0, name: "Starter Free" },
            lifetime: { amount: 0, display: 0, name: "Starter Free" }
        },
        pro: {
            monthly: { amount: 49900, display: 499, name: "Pro" },
            annual: { amount: 39900 * 12, display: 399, name: "Pro (Annual)" },
            lifetime: { amount: 499000, display: 4990, name: "Pro (Lifetime)" }
        },
        ultra: {
            monthly: { amount: 99900, display: 999, name: "Ultra" },
            annual: { amount: 79900 * 12, display: 799, name: "Ultra (Annual)" },
            lifetime: { amount: 999000, display: 9990, name: "Ultra (Lifetime)" }
        }
    },
    USD: {
        symbol: "$",
        free: {
            monthly: { amount: 0, display: 0, name: "Starter Free" },
            annual: { amount: 0, display: 0, name: "Starter Free" },
            lifetime: { amount: 0, display: 0, name: "Starter Free" }
        },
        pro: {
            monthly: { amount: 900, display: 9, name: "Pro" },
            annual: { amount: 700 * 12, display: 7, name: "Pro (Annual)" },
            lifetime: { amount: 9900, display: 99, name: "Pro (Lifetime)" }
        },
        ultra: {
            monthly: { amount: 1900, display: 19, name: "Ultra" },
            annual: { amount: 1500 * 12, display: 15, name: "Ultra (Annual)" },
            lifetime: { amount: 19900, display: 199, name: "Ultra (Lifetime)" }
        }
    }
};

export async function getGatewayMode() {
    try {
        if (redisClient && isRedisReady()) {
            const mode = await redisClient.get("razorpay_gateway_mode");
            if (mode) return mode;
        }
    } catch (e) {}
    return process.env.RAZORPAY_GATEWAY_MODE || "test";
}

export async function getActivePricing() {
    try {
        if (redisClient && isRedisReady()) {
            const raw = await redisClient.get("razorpay_custom_plans");
            if (raw) return JSON.parse(raw);
        }
    } catch (e) {}
    return DEFAULT_PLAN_PRICING;
}

function getRazorpayInstance() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials are not configured on server");
    }
    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });
}

/**
 * Create Genuine Razorpay Order
 * POST /api/subscription/create-order
 */
export async function createOrder(req, res) {
    try {
        const userId = req.user?.id;
        const { plan, billingCycle = "monthly", currency = "INR" } = req.body;

        if (!plan || !["pro", "ultra"].includes(plan)) {
            return res.status(400).json({
                success: false,
                message: "Valid plan ('pro' or 'ultra') is required"
            });
        }

        const validCurrency = currency === "USD" ? "USD" : "INR";
        const cycle = ["annual", "lifetime"].includes(billingCycle) ? billingCycle : "monthly";
        const pricing = await getActivePricing();
        const planGroup = (pricing[validCurrency] || DEFAULT_PLAN_PRICING[validCurrency])[plan] || (DEFAULT_PLAN_PRICING[validCurrency])[plan];
        const priceConfig = planGroup[cycle] || planGroup.lifetime || planGroup.monthly;
        const currentMode = await getGatewayMode();

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User account not found" });
        }

        const razorpay = getRazorpayInstance();
        const shortReceipt = `rcpt_${userId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;

        const options = {
            amount: priceConfig.amount,
            currency: validCurrency,
            receipt: shortReceipt,
            notes: {
                userId: userId.toString(),
                userEmail: user.email,
                plan,
                billingCycle: cycle,
                currency: validCurrency,
                mode: currentMode
            }
        };

        const order = await razorpay.orders.create(options);

        return res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            plan,
            billingCycle: cycle,
            gatewayMode: currentMode,
            planName: priceConfig.name,
            user: {
                name: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error("Razorpay order creation error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to create payment order with Razorpay",
            error: err.message
        });
    }
}

/**
 * Strictly Verify Razorpay Payment Signature and Upgrade Subscription
 * POST /api/subscription/verify-payment
 * (NO free or simulated bypass allowed)
 */
export async function verifyPayment(req, res) {
    try {
        const userId = req.user?.id;
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            plan,
            billingCycle = "monthly",
            currency = "INR"
        } = req.body;

        if (!plan || !["pro", "ultra"].includes(plan)) {
            return res.status(400).json({ success: false, message: "Valid plan ('pro' or 'ultra') is required" });
        }

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: "Incomplete payment data. Payment verification failed."
            });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            return res.status(500).json({ success: false, message: "Server payment configuration missing" });
        }

        // 1. Cryptographic HMAC-SHA256 signature verification
        const hmac = crypto.createHmac("sha256", keySecret);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest("hex");

        if (generatedSignature !== razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: "Fraud prevention check: Razorpay payment signature verification failed."
            });
        }

        // 2. Direct Razorpay API verification check
        const razorpay = getRazorpayInstance();
        const paymentRecord = await razorpay.payments.fetch(razorpayPaymentId);

        if (!paymentRecord || (paymentRecord.status !== "captured" && paymentRecord.status !== "authorized")) {
            return res.status(400).json({
                success: false,
                message: `Payment status is ${paymentRecord?.status || 'unverified'}. Account cannot be upgraded without verified settlement.`
            });
        }

        if (paymentRecord.order_id !== razorpayOrderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID mismatch. Payment rejected."
            });
        }

        // 3. Process genuine upgrade
        const validCurrency = currency === "USD" ? "USD" : "INR";
        const cycle = billingCycle === "annual" ? "annual" : "monthly";
        const pricing = await getActivePricing();
        const planPricing = (pricing[validCurrency] || DEFAULT_PLAN_PRICING[validCurrency])[plan] || (DEFAULT_PLAN_PRICING[validCurrency])[plan];
        const priceConfig = planPricing[cycle] || planPricing.monthly;

        const now = new Date();
        const endDate = new Date(now);
        if (cycle === "annual") {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Upgrade quotas
        const queriesLimit = -1; // Unlimited queries for Pro and Ultra
        const documentUploadsLimit = plan === "ultra" ? -1 : 50;
        const socialPostsLimit = -1; // Unlimited social posts for Pro and Ultra

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            {
                $set: {
                    subscription: {
                        plan,
                        billingCycle: cycle,
                        status: "active",
                        startDate: now,
                        endDate,
                        razorpayOrderId,
                        razorpayPaymentId,
                        amount: priceConfig.display,
                        currency: validCurrency
                    },
                    "usageQuotas.queriesLimit": queriesLimit,
                    "usageQuotas.documentUploadsLimit": documentUploadsLimit,
                    "usageQuotas.socialPostsLimit": socialPostsLimit
                }
            },
            { new: true }
        ).select("-password");

        return res.status(200).json({
            success: true,
            message: `Payment verified successfully! Welcome to Parsu AI ${plan.toUpperCase()}.`,
            user: updatedUser,
            subscription: updatedUser.subscription,
            quotas: updatedUser.usageQuotas
        });
    } catch (err) {
        console.error("Payment verification error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to verify Razorpay payment",
            error: err.message
        });
    }
}

/**
 * Fetch Current User's Subscription & Quotas
 * GET /api/subscription/me
 */
export async function getSubscriptionStatus(req, res) {
    try {
        const userId = req.user?.id;
        const user = await userModel.findById(userId).select("subscription usageQuotas username email role");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const subscription = user.subscription || {
            plan: "free",
            billingCycle: "none",
            status: "active",
            startDate: user.createdAt || new Date(),
            endDate: null
        };

        const quotas = user.usageQuotas || {
            queriesToday: 0,
            queriesLimit: 50,
            documentUploadsToday: 0,
            documentUploadsLimit: 2,
            socialPostsThisMonth: 0,
            socialPostsLimit: 10
        };

        return res.status(200).json({
            success: true,
            subscription,
            quotas,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Error fetching subscription status:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subscription data",
            error: err.message
        });
    }
}

/**
 * Public Plans & Pricing with Location-Based Currency Auto-Detection
 * GET /api/subscription/plans
 */
export async function getPublicPlans(req, res) {
    try {
        const pricing = await getActivePricing();
        const gatewayMode = await getGatewayMode();

        const country = (
            req.headers["cf-ipcountry"] ||
            req.headers["x-country-code"] ||
            req.headers["x-client-country"] ||
            ""
        ).toUpperCase();

        const acceptLang = req.headers["accept-language"] || "";
        const isIndia = country === "IN" || acceptLang.includes("en-IN") || acceptLang.includes("hi");
        const detectedCurrency = isIndia ? "INR" : "USD";

        return res.status(200).json({
            success: true,
            pricing,
            gatewayMode, // "test" or "payable"
            detectedCurrency,
            isIndia,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch plan catalog",
            error: err.message
        });
    }
}

/**
 * Admin: Toggle Razorpay Gateway Mode (Test vs Payable/Live)
 * PUT /api/subscription/admin/gateway-mode
 */
export async function updateGatewayMode(req, res) {
    try {
        const { mode } = req.body;
        if (!mode || !["test", "payable"].includes(mode)) {
            return res.status(400).json({
                success: false,
                message: "Valid gateway mode ('test' or 'payable') is required"
            });
        }

        if (redisClient && isRedisReady()) {
            await redisClient.set("razorpay_gateway_mode", mode);
        }
        process.env.RAZORPAY_GATEWAY_MODE = mode;

        return res.status(200).json({
            success: true,
            message: `Razorpay gateway mode updated to ${mode.toUpperCase()}`,
            gatewayMode: mode
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to update gateway mode",
            error: err.message
        });
    }
}

/**
 * Admin: Update Plan Pricing Catalog
 * PUT /api/subscription/admin/plans
 */
export async function updatePlanPricing(req, res) {
    try {
        const { pricing } = req.body;
        if (!pricing || !pricing.INR || !pricing.USD) {
            return res.status(400).json({
                success: false,
                message: "Valid pricing object containing INR and USD plans is required"
            });
        }

        if (redisClient && isRedisReady()) {
            await redisClient.set("razorpay_custom_plans", JSON.stringify(pricing));
        }

        return res.status(200).json({
            success: true,
            message: "Plan pricing catalog updated successfully",
            pricing
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to update pricing catalog",
            error: err.message
        });
    }
}

/**
 * Admin: Get All Subscribers and Active Plans
 * GET /api/subscription/admin/subscribers
 */
export async function getAdminSubscribers(req, res) {
    try {
        const subscribers = await userModel.find(
            { "subscription.plan": { $ne: "free" } },
            "username email role subscription usageQuotas createdAt updatedAt"
        ).sort({ "subscription.startDate": -1 }).lean();

        const gatewayMode = await getGatewayMode();
        const pricing = await getActivePricing();

        return res.status(200).json({
            success: true,
            subscribers,
            totalSubscribers: subscribers.length,
            gatewayMode,
            pricing
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subscribers list",
            error: err.message
        });
    }
}
