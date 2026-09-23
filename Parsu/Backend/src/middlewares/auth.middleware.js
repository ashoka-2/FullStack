import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import redisClient, { isRedisReady } from "../config/redis.js";

export async function authUser(req, res, next) {
    // Cookie-first, then Bearer-header fallback (matching Scapegoat for cross-site cookie restrictions)
    const bearer =
        req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : null;
    const token = req.cookies?.token || bearer;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            err: "No token provided",
        });
    }

    try {
        // Token Blacklist verification via Redis (matching Scapegoat)
        if (redisClient && isRedisReady()) {
            const isBlacklisted = await redisClient.get(`blacklist_${token}`);
            if (isBlacklisted) {
                return res.status(401).json({
                    success: false,
                    message: "Token is no longer valid",
                    err: "Token revoked",
                });
            }
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            err: "Invalid token",
        });
    }
}

export async function requireAdmin(req, res, next) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    try {
        const user = await userModel.findById(req.user.id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Administrator privileges required."
            });
        }
        req.adminUser = user;
        next();
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error verifying admin privileges",
            err: err.message
        });
    }
}

export async function optionalAuthUser(req, res, next) {
    const bearer =
        req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : null;
    const token = req.cookies?.token || bearer;

    if (!token) {
        req.user = null;
        return next();
    }
    try {
        if (redisClient && isRedisReady()) {
            const isBlacklisted = await redisClient.get(`blacklist_${token}`);
            if (isBlacklisted) {
                req.user = null;
                return next();
            }
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        req.user = null;
        next();
    }
}