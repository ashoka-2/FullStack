import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import "./config/passport.js";
import authRouter from "./routes/auth.routes.js"
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import chatRouter from "./routes/chat.routes.js";
import socialRouter from "./routes/social.routes.js";
import documentRouter from "./routes/document.routes.js";
import mongoose from "mongoose";
import { generalLimiter } from "./middlewares/rateLimiter.middleware.js";

const app = express();

// Trust reverse proxy (Render / Heroku)
app.set("trust proxy", 1);

// ─── Security Headers (Helmet.js) ──────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: false, // Disabled to avoid blocking CDN/external resources
}));

// ─── Global Rate Limiting ──────────────────────────────────────────────────────
app.use(generalLimiter);

// Allow both production and local development origins
const allowedOrigins = [
    'https://parsuai.vercel.app',
    'https://perplexity-cohort.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-socket-id']
}));

app.use(morgan("dev"));
app.use(cookieParser());
app.use(passport.initialize());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({ Message: "Welcome to Parsu Backend API" })
})

// Comprehensive Health Check Endpoint
app.get(["/health", "/api/health"], (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };

    const isDbHealthy = dbStatus === 1;

    res.status(isDbHealthy ? 200 : 503).json({
        status: isDbHealthy ? "healthy" : "degraded",
        message: isDbHealthy ? "All systems operational" : "Database connection issues",
        timestamp: new Date().toISOString(),
        uptime: `${process.uptime().toFixed(2)}s`,
        database: {
            status: dbStates[dbStatus] || "unknown",
            readyState: dbStatus
        },
        system: {
            memoryUsage: {
                rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
            },
            nodeVersion: process.version
        },
        environment: process.env.NODE_ENV || "development"
    });
});

import modelRouter from "./routes/model.routes.js";

app.use("/api/auth", authRouter)
app.use("/api/chats", chatRouter)
app.use("/api/social", socialRouter)
app.use("/api/models", modelRouter)
app.use("/api/documents", documentRouter)

export default app;

