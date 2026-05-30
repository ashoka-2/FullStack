import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import wishlistModel from "../models/wishlist.model.js";
import placeModel from "../models/place.model.js";
import { broadcastUpdate } from "../services/socket.service.js";

// Get user's wishlist
export const getWishlist = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        let wishlist = await wishlistModel.findOne({ user: userId }).populate({
            path: "products",
            select: "title price images stock description category brand unit"
        });

        if (!wishlist) {
            wishlist = await wishlistModel.create({ user: userId, products: [] });
        }

        return res.status(200).json({ success: true, wishlist });
    } catch (error) {
        console.error("Get wishlist error:", error);
        return res.status(500).json({ message: "Server error retrieving wishlist" });
    }
};

// Toggle product in wishlist (Add/Remove)
export const toggleWishlist = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
    }

    try {
        const product = await placeModel.db.model("Product").findById(productId);
        if (product && product.seller.toString() === userId) {
            return res.status(400).json({ message: "Sellers cannot add their own products to the wishlist" });
        }

        let wishlist = await wishlistModel.findOne({ user: userId });

        if (!wishlist) {
            wishlist = new wishlistModel({ user: userId, products: [] });
        }

        const productIndex = wishlist.products.indexOf(productId);

        let action = "added";
        if (productIndex > -1) {
            // Remove
            wishlist.products.splice(productIndex, 1);
            action = "removed";
        } else {
            // Add
            wishlist.products.push(productId);
        }

        await wishlist.save();
        broadcastUpdate("wishlist_update");

        const populatedWishlist = await wishlistModel.findById(wishlist._id).populate({
            path: "products",
            select: "title price images stock description category brand unit"
        });

        return res.status(200).json({
            success: true,
            message: `Product ${action} wishlist`,
            wishlist: populatedWishlist,
            action
        });
    } catch (error) {
        console.error("Toggle wishlist error:", error);
        return res.status(500).json({ message: "Server error toggling wishlist" });
    }
};

// Get all wishlists (Seller/Admin only)
export const getAllWishlists = async (req: AuthRequest, res: Response) => {
    try {
        const wishlists = await wishlistModel.find()
            .populate({
                path: "user",
                select: "fullname email contact profilePic role"
            })
            .populate({
                path: "products",
                select: "title price images stock"
            });

        // Query places for all these users
        const userIds = wishlists.map(w => w.user?._id).filter(id => id);
        const places = await placeModel.find({ user: { $in: userIds } });

        const enrichedWishlists = wishlists.map(wish => {
            const wishObj = wish.toObject();
            if (wishObj.user) {
                const userPlace = places.find(p => p.user.toString() === wishObj.user._id.toString());
                (wishObj.user as any).place = userPlace ? `${userPlace.place}, ${userPlace.city}, ${userPlace.state}` : "";
                (wishObj.user as any).addressDetails = userPlace || null;
            }
            return wishObj;
        });

        // Filter out empty wishlists
        const activeWishlists = enrichedWishlists.filter(w => w.products && w.products.length > 0);

        return res.status(200).json({ success: true, wishlists: activeWishlists });
    } catch (error) {
        console.error("Get all wishlists error:", error);
        return res.status(500).json({ message: "Server error retrieving wishlists list" });
    }
};
