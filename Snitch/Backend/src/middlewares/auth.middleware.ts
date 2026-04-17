import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import redisClient from "../config/redis.js";

export interface UserPayload {
    id: string;
    fullname: string;
    email: string;
    contact: string;
    role: "buyer" | "seller";
    profilePic: string;
    verified: boolean;
}

export interface AuthRequest extends Request {
    user?: any;
    files?: any;
}

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


export const authenticateSeller = (req:AuthRequest,res:Response,next:NextFunction)=>{
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({
            message:"Not authenticated",
            success:false,
            err:"Token not Found"
        })
    }

    try{

        const decoded = jwt.verify(token, config.JWT_SECRET) as UserPayload;
        if (decoded.role !== "seller") {
            return res.status(401).json({
                message:"Not authorized",
                success:false,
                err:"Not authorized"
            })
        }
        req.user = decoded;
        next();

    }
    catch(error){
        return res.status(401).json({
            message:"Not authenticated",
            success:false,
            err:"Invalid Token"
        })
    }
    
}