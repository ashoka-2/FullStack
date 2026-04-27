import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import redisClient from "../config/redis.js";
import userModel from "../models/user.model.js";

export interface UserPayload {
    id: string;
    fullname: string;
    email: string;
    contact: string;
    role: "buyer" | "seller";
    isAdmin: boolean;
    profilePic: string;
    verified: boolean;
}

export interface AuthRequest extends Request {
    user?: UserPayload;
    files?: any;
}

// ─── Verify any logged-in user ────────────────────────────────────────────
export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        // Check if token is blacklisted
        const isBlacklisted = await redisClient.get(`blacklist_${token}`);
        if (isBlacklisted) {
            return res.status(401).json({ message: "Token is no longer valid" });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as UserPayload;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};


export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as UserPayload;
        const user = await userModel.findById(decoded.id);

        if (!user || user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export const authenticateSeller = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as UserPayload;
        const user = await userModel.findById(decoded.id);

        // Admins can also perform seller actions for management purposes
        if (!user || (user.role !== "seller" && user.role !== "admin")) {
            return res.status(403).json({ success: false, message: "Seller or Admin access required" });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid session" });
    }
};