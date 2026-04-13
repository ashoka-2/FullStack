import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import redisClient from "../config/redis.js";
import userModel, { IUser } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

async function sendTokenResponse(user: IUser, res: Response, message: string) {
    const token = jwt.sign(
        {
            id: user._id,
        },
        config.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );

    res.cookie("token", token, {
        httpOnly: true, // Recommended for security
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    res.status(200).json({
        message,
        success: true,
        user: {
            id: user._id,
            email: user.email,
            contact: user.contact,
            fullname: user.fullname,
            role: user.role,
            profilePic: user.profilePic,
        },
    });
}

export const register = async (req: Request, res: Response) => {
    const { email, contact, password, fullname, isSeller } = req.body;

    try {
        const existingUser = await userModel.findOne({
            $or: [{ email }, { contact }],
        });

        if (existingUser) {
            return res.status(400).json({ message: "User with this email or contact already exists" });
        }

        const user = await userModel.create({
            email,
            contact,
            password,
            fullname,
            role: isSeller ? "seller" : "buyer",
        });

        await sendTokenResponse(user, res, "User registered successfully");
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req: Request, res: Response) => {
    const { identifier, password } = req.body;

    try {
        const user = await userModel.findOne({
            $or: [{ email: identifier }, { contact: identifier }],
        }).select("+password"); // Need to select password for comparison

        if (!user) {
            return res.status(400).json({ message: "Invalid email/contact or password" });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        await sendTokenResponse(user, res, "User logged in successfully");
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const googleCallback = async (req: Request, res: Response) => {
    const passportUser = req.user as any;
    if (!passportUser) {
        return res.redirect("http://localhost:5173/login?error=auth_failed");
    }

    const { id, displayName, emails, photos } = passportUser;
    const email = emails[0].value;
    // const profilePic = photos[ 0 ].value; // Can be used if needed

    try {
        let user = await userModel.findOne({ email });

        if (!user) {
            user = await userModel.create({
                email,
                googleId: id,
                fullname: displayName,
                contact: `G-${id}`.slice(0, 15), // Satisfy required/unique constraint
                role: "buyer", // Default role
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.redirect("http://localhost:5173/");
    } catch (error) {
        console.log(error);
        res.redirect("http://localhost:5173/login?error=server_error");
    }
};




export const getMe = async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const user = await userModel.findById(userId);

    if (!user) {
        return res.status(400).json({
            success: false,
            message: "User not found",
            err: "user not found",
        });
    }

    res.status(200).json({
        success: true,
        user,
    });
};

export const logout = async (req: Request, res: Response) => {
    const token = req.cookies.token;

    try {
        if (token) {
            // Blacklist the token in Redis for 7 days (matching JWT expiry)
            await redisClient.set(`blacklist_${token}`, "true", "EX", 7 * 24 * 60 * 60);
        }

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error during logout" });
    }
};
