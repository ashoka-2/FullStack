import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import redisClient from "../config/redis.js";
import { uploadFile } from "../services/imagekit.service.js";
import userModel, { IUser } from "../models/user.model.js";
import placeModel from "../models/place.model.js";
import wishlistModel from "../models/wishlist.model.js";
import cartModel from "../models/cart.model.js";
import orderModel from "../models/order.model.js";
import orderSubModel from "../models/orderSub.model.js";
import productModel from "../models/product.model.js";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { broadcastUpdate } from "../services/socket.service.js";

async function sendTokenResponse(user: IUser, res: Response, message: string) {
    const token = jwt.sign(
        {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            contact: user.contact,
            role: user.role,
            profilePic: user.profilePic,
            verified: user.verified,
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

        if (user.isBanned) {
            return res.status(403).json({ message: "You are banned and cannot log in." });
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
        return res.redirect(`${config.FRONTEND_URL}/login?error=auth_failed`);
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

        if (user.isBanned) {
            return res.redirect(`${config.FRONTEND_URL}/login?error=banned`);
        }

        const token = jwt.sign(
            {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                contact: user.contact,
                role: user.role,
                profilePic: user.profilePic,
                verified: user.verified,
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

        res.redirect(config.FRONTEND_URL);
    } catch (error) {
        console.log(error);
        res.redirect(`${config.FRONTEND_URL}/login?error=server_error`);
    }
};

export const checkAuth = async (req: AuthRequest, res: Response) => {
    try {
        const user = await userModel.findById(req.user?.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const userPlace = await placeModel.findOne({ user: user._id });
        const userObj = user.toObject();
        (userObj as any).place = userPlace ? `${userPlace.place}, ${userPlace.city}, ${userPlace.state}` : "";
        (userObj as any).addressDetails = userPlace || null;

        return res.status(200).json({ success: true, user: userObj });
    } catch (err) {
        console.error("Check Auth Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await userModel.findById(userId);

    if (!user) {
        return res.status(400).json({
            success: false,
            message: "User not found",
            err: "user not found",
        });
    }

    const userPlace = await placeModel.findOne({ user: userId });
    const userObj = user.toObject();
    (userObj as any).place = userPlace ? `${userPlace.place}, ${userPlace.city}, ${userPlace.state}` : "";
    (userObj as any).addressDetails = userPlace || null;

    res.status(200).json({
        success: true,
        user: userObj,
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

export const updateProfile = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { fullname, contact } = req.body;
    const file = req.file;

    try {
        // Check if new contact is already taken by someone else
        if (contact) {
            const existingUser = await userModel.findOne({
                _id: { $ne: userId },
                contact: contact
            });

            if (existingUser) {
                return res.status(400).json({ message: "Contact number already in use by another account" });
            }
        }

        let profilePicUrl = undefined;
        if (file) {
            const uploadResponse = await uploadFile({
                file: file.buffer,
                filename: `profile-${userId}-${Date.now()}`,
                folder: `/Snitch/profiles`
            });
            profilePicUrl = uploadResponse.url;
        }

        const updateData: any = {
            ...(fullname && { fullname }),
            ...(contact && { contact }),
            ...(profilePicUrl && { profilePic: profilePicUrl })
        };

        // Only allow switching from buyer to seller
        if (req.body.role === 'seller') {
            const currentUser = await userModel.findById(userId);
            if (currentUser && currentUser.role === 'buyer') {
                updateData.role = 'seller';
            }
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userPlace = await placeModel.findOne({ user: userId });
        const userObj = user.toObject();
        (userObj as any).place = userPlace ? `${userPlace.place}, ${userPlace.city}, ${userPlace.state}` : "";
        (userObj as any).addressDetails = userPlace || null;

        await sendTokenResponse(user, res, "Profile updated successfully");
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error during profile update" });
    }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await userModel.find({ role: { $ne: "admin" } }).select("-password");
        const places = await placeModel.find();
        
        const enrichedUsers = users.map(u => {
            const userObj = u.toObject();
            const userPlace = places.find(p => p.user.toString() === userObj._id.toString());
            (userObj as any).place = userPlace ? `${userPlace.place}, ${userPlace.city}, ${userPlace.state}` : "";
            (userObj as any).addressDetails = userPlace || null;
            return userObj;
        });

        return res.status(200).json({ success: true, users: enrichedUsers });
    } catch (error) {
        console.error("Get all users error:", error);
        return res.status(500).json({ message: "Server error retrieving users" });
    }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
    const userId = req.params.id as any;
    try {
        const user = await userModel.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userPlace = await placeModel.findOne({ user: userId });
        const userObj = user.toObject();
        (userObj as any).place = userPlace ? `${userPlace.place}, ${userPlace.city}, ${userPlace.state}` : "";
        (userObj as any).addressDetails = userPlace || null;

        return res.status(200).json({ success: true, user: userObj });
    } catch (error) {
        console.error("Get user by ID error:", error);
        return res.status(500).json({ message: "Server error retrieving user details" });
    }
};

// ─── Get full user detail: profile + wishlist + cart + orders + products ──────
export const getUserDetail = async (req: AuthRequest, res: Response) => {
    const userId = req.params.id as any;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    try {
        const [user, place, wishlist, cart, rawOrders] = await Promise.all([
            userModel.findById(userId).select("-password"),
            placeModel.findOne({ user: userId }),
            wishlistModel.findOne({ user: userId }).populate({
                path: "products",
                select: "title price images stock category brand",
            }),
            cartModel.findOne({ user: userId })
                .populate({ path: "items.product", select: "title price images stock category brand" })
                .populate({ path: "items.size", select: "name" })
                .populate({ path: "items.color", select: "name hexCode" }),
            orderModel.find({ buyer: userId }).sort({ createdAt: -1 }),
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Fetch OrderSub child rows for all user's orders
        const orderIds = rawOrders.map(o => o._id);
        const allSubs = await orderSubModel.find({ order: { $in: orderIds } })
            .populate({
                path: "product",
                select: "title price images description seller",
                populate: [
                    { path: "category", select: "name" },
                    { path: "brand", select: "name" },
                    { path: "seller", select: "fullname email" }
                ]
            })
            .populate({ path: "size", select: "name" })
            .populate({ path: "color", select: "name hexCode" });

        const enrichedOrders = rawOrders.map(o => {
            const orderObj = o.toObject() as any;
            orderObj.items = allSubs.filter(sub => sub.order.toString() === orderObj._id.toString());
            return orderObj;
        });

        const userObj = user.toObject() as any;
        userObj.addressDetails = place || null;
        userObj.place = place ? `${place.place}, ${place.city}, ${place.state}` : "";
        userObj.wishlist = wishlist || { products: [] };
        userObj.cart = cart || { items: [] };
        userObj.orders = enrichedOrders;

        // If the user is a seller, also fetch their listed products
        if (user.role === "seller") {
            const products = await productModel
                .find({ seller: userId })
                .populate("category", "name")
                .populate("brand", "name")
                .sort({ createdAt: -1 });
            userObj.products = products;
        } else {
            userObj.products = [];
        }

        return res.status(200).json({ success: true, user: userObj });
    } catch (error) {
        console.error("Get user detail error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── Toggle Ban User ──────────────────────────────────────────────────────────
export const toggleBanUser = async (req: AuthRequest, res: Response) => {
    const userId = req.params.id as any;
    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.role === "admin") {
            return res.status(400).json({ success: false, message: "Admin users cannot be banned" });
        }
        user.isBanned = !user.isBanned;
        await user.save();
        
        broadcastUpdate("user_ban_update", { userId: user._id.toString(), isBanned: user.isBanned });

        return res.status(200).json({ 
            success: true, 
            message: `User has been ${user.isBanned ? 'banned' : 'unbanned'}`, 
            isBanned: user.isBanned 
        });
    } catch (error) {
        console.error("Toggle ban error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
