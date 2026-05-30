import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import adminRouter from "./routes/admin.routes.js";
import cartRouter from "./routes/cart.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";
import orderRouter from "./routes/order.routes.js";
import placeRouter from "./routes/place.routes.js";

import cors from "cors";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config } from "./config/config.js";
import { generalLimiter, authLimiter } from "./middlewares/rateLimiter.middleware.js";

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In production, config.FRONTEND_URL = your Vercel URL (set as env var on Render)
app.use(cors({
    origin: config.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,              // Required for cookies to work cross-domain
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
app.use("/api", generalLimiter);

app.use(passport.initialize());

// ─── Google OAuth ──────────────────────────────────────────────────────────────
// callbackURL must exactly match what you register in Google Cloud Console
// In production set BACKEND_URL on Render e.g. https://snitch-api.onrender.com
passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: `${config.BACKEND_URL}/api/auth/google/callback`,
    proxy: true
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

app.get("/", (_req, res) => {
    res.status(200).json({ message: "Server is running" });
});

app.use("/api/auth",      authRouter);
app.use("/api/products",  productRouter);
app.use("/api/admin",     adminRouter);
app.use("/api/carts",     cartRouter);
app.use("/api/wishlists", wishlistRouter);
app.use("/api/orders",    orderRouter);
app.use("/api/places",    placeRouter);

export default app;