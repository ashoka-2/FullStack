import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import cartModel from "../models/cart.model.js";
import placeModel from "../models/place.model.js";

// Get user's cart
export const getCart = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        let cart = await cartModel.findOne({ user: userId })
            .populate({
                path: "items.product",
                select: "title price images stock description category brand unit"
            })
            .populate({
                path: "items.size",
                select: "name"
            })
            .populate({
                path: "items.color",
                select: "name hexCode"
            });

        if (!cart) {
            cart = await cartModel.create({ user: userId, items: [] });
        }

        return res.status(200).json({ success: true, cart });
    } catch (error) {
        console.error("Get cart error:", error);
        return res.status(500).json({ message: "Server error retrieving cart" });
    }
};

// Add item to cart
export const addToCart = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { productId, sizeId, colorId, quantity = 1 } = req.body;

    if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
    }

    try {
        let cart = await cartModel.findOne({ user: userId });

        if (!cart) {
            cart = new cartModel({ user: userId, items: [] });
        }

        // Check if item already exists in cart with same product, size, and color
        const itemIndex = cart.items.findIndex(item => {
            const sameProduct = item.product.toString() === productId;
            const sameSize = (!item.size && !sizeId) || (item.size?.toString() === sizeId);
            const sameColor = (!item.color && !colorId) || (item.color?.toString() === colorId);
            return sameProduct && sameSize && sameColor;
        });

        if (itemIndex > -1) {
            const item = cart.items[itemIndex];
            if (item) {
                item.quantity += Number(quantity);
            }
        } else {
            cart.items.push({
                product: productId,
                size: sizeId || null,
                color: colorId || null,
                quantity: Number(quantity),
            } as any);
        }

        await cart.save();

        const populatedCart = await cartModel.findById(cart._id)
            .populate({
                path: "items.product",
                select: "title price images stock description category brand unit"
            })
            .populate({
                path: "items.size",
                select: "name"
            })
            .populate({
                path: "items.color",
                select: "name hexCode"
            });

        return res.status(200).json({ success: true, message: "Added to cart", cart: populatedCart });
    } catch (error) {
        console.error("Add to cart error:", error);
        return res.status(500).json({ message: "Server error adding to cart" });
    }
};

// Update cart item quantity
export const updateCartItem = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { itemId, quantity } = req.body;

    if (!itemId || quantity === undefined) {
        return res.status(400).json({ message: "Item ID and quantity are required" });
    }

    if (Number(quantity) < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    try {
        const cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(item => item._id?.toString() === itemId);

        if (itemIndex > -1) {
            const item = cart.items[itemIndex];
            if (item) {
                item.quantity = Number(quantity);
            }
            await cart.save();
        } else {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        const populatedCart = await cartModel.findById(cart._id)
            .populate({
                path: "items.product",
                select: "title price images stock description category brand unit"
            })
            .populate({
                path: "items.size",
                select: "name"
            })
            .populate({
                path: "items.color",
                select: "name hexCode"
            });

        return res.status(200).json({ success: true, message: "Cart updated", cart: populatedCart });
    } catch (error) {
        console.error("Update cart error:", error);
        return res.status(500).json({ message: "Server error updating cart" });
    }
};

// Remove item from cart
export const removeFromCart = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { itemId } = req.params;

    try {
        const cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = cart.items.filter(item => item._id?.toString() !== itemId);
        await cart.save();

        const populatedCart = await cartModel.findById(cart._id)
            .populate({
                path: "items.product",
                select: "title price images stock description category brand unit"
            })
            .populate({
                path: "items.size",
                select: "name"
            })
            .populate({
                path: "items.color",
                select: "name hexCode"
            });

        return res.status(200).json({ success: true, message: "Removed from cart", cart: populatedCart });
    } catch (error) {
        console.error("Remove from cart error:", error);
        return res.status(500).json({ message: "Server error removing item" });
    }
};

// Clear cart
export const clearCart = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const cart = await cartModel.findOne({ user: userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        return res.status(200).json({ success: true, message: "Cart cleared", cart });
    } catch (error) {
        console.error("Clear cart error:", error);
        return res.status(500).json({ message: "Server error clearing cart" });
    }
};

// Get all users' carts (Seller/Admin only)
export const getAllCarts = async (req: AuthRequest, res: Response) => {
    try {
        const carts = await cartModel.find()
            .populate({
                path: "user",
                select: "fullname email contact profilePic role"
            })
            .populate({
                path: "items.product",
                select: "title price images stock"
            })
            .populate({
                path: "items.size",
                select: "name"
            })
            .populate({
                path: "items.color",
                select: "name hexCode"
            });

        // Query places for all these users
        const userIds = carts.map(c => c.user?._id).filter(id => id);
        const places = await placeModel.find({ user: { $in: userIds } });

        const enrichedCarts = carts.map(cart => {
            const cartObj = cart.toObject();
            if (cartObj.user) {
                const userPlace = places.find(p => p.user.toString() === cartObj.user._id.toString());
                (cartObj.user as any).place = userPlace ? `${userPlace.place}, ${userPlace.city}, ${userPlace.state}` : "";
                (cartObj.user as any).addressDetails = userPlace || null;
            }
            return cartObj;
        });

        // Filter out empty carts to make dashboard display cleaner
        const activeCarts = enrichedCarts.filter(c => c.items && c.items.length > 0);

        return res.status(200).json({ success: true, carts: activeCarts });
    } catch (error) {
        console.error("Get all carts error:", error);
        return res.status(500).json({ message: "Server error retrieving carts list" });
    }
};
