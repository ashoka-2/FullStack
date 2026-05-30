import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import orderModel from "../models/order.model.js";
import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import placeModel from "../models/place.model.js";

// Place order
export const createOrder = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { shippingAddress, contactNumber, items: customItems } = req.body;

    try {
        let orderItems = [];
        let totalAmount = 0;

        // Fetch address from User's Place model if not provided
        let resolvedAddress = shippingAddress;
        if (!resolvedAddress) {
            const userPlace = await placeModel.findOne({ user: userId });
            if (!userPlace) {
                return res.status(400).json({ message: "No shipping address provided or found on profile" });
            }
            resolvedAddress = {
                pincode: userPlace.pincode,
                post: userPlace.post,
                place: userPlace.place,
                city: userPlace.city,
                state: userPlace.state
            };
        }

        // Fetch contact from User if not provided
        let resolvedContact = contactNumber;
        if (!resolvedContact) {
            resolvedContact = req.user?.contact;
        }

        if (customItems && customItems.length > 0) {
            // Check out specific items
            for (const item of customItems) {
                const productObj = await productModel.findById(item.product);
                if (!productObj) {
                    return res.status(404).json({ message: `Product ${item.product} not found` });
                }
                if (productObj.stock < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for ${productObj.title}` });
                }

                const price = productObj.price.saleAmount || productObj.price.amount;
                orderItems.push({
                    product: item.product,
                    size: item.size || null,
                    color: item.color || null,
                    quantity: item.quantity,
                    price: price
                });
                totalAmount += price * item.quantity;
            }
        } else {
            // Check out using Cart
            const cart = await cartModel.findOne({ user: userId }).populate("items.product");
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ message: "Your cart is empty" });
            }

            for (const item of cart.items) {
                const productObj = item.product as any;
                if (!productObj) continue;
                if (productObj.stock < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for ${productObj.title}` });
                }

                const price = productObj.price.saleAmount || productObj.price.amount;
                orderItems.push({
                    product: productObj._id,
                    size: item.size || null,
                    color: item.color || null,
                    quantity: item.quantity,
                    price: price
                });
                totalAmount += price * item.quantity;
            }
        }

        if (orderItems.length === 0) {
            return res.status(400).json({ message: "No items to order" });
        }

        // Place the order (Deduct stock)
        for (const item of orderItems) {
            await productModel.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        const newOrder = await orderModel.create({
            buyer: userId,
            items: orderItems,
            totalAmount,
            shippingAddress: resolvedAddress,
            contactNumber: resolvedContact,
            status: "pending",
            paymentStatus: "paid", // Simulated payment success for checkout
        });

        // Clear cart if ordered from cart
        if (!customItems || customItems.length === 0) {
            await cartModel.findOneAndUpdate({ user: userId }, { items: [] });
        }

        return res.status(201).json({ success: true, message: "Order placed successfully", order: newOrder });
    } catch (error) {
        console.error("Create order error:", error);
        return res.status(500).json({ message: "Server error placing order" });
    }
};

// Get logged-in user's orders
export const getMyOrders = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const orders = await orderModel.find({ buyer: userId })
            .populate({
                path: "items.product",
                select: "title price images description"
            })
            .populate({
                path: "items.size",
                select: "name"
            })
            .populate({
                path: "items.color",
                select: "name hexCode"
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Get my orders error:", error);
        return res.status(500).json({ message: "Server error fetching your orders" });
    }
};

// Get all orders (Sellers & Admins only)
export const getAllOrders = async (req: AuthRequest, res: Response) => {
    try {
        const orders = await orderModel.find()
            .populate({
                path: "buyer",
                select: "fullname email contact profilePic role"
            })
            .populate({
                path: "items.product",
                select: "title price images description seller"
            })
            .populate({
                path: "items.size",
                select: "name"
            })
            .populate({
                path: "items.color",
                select: "name hexCode"
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Get all orders error:", error);
        return res.status(500).json({ message: "Server error fetching orders list" });
    }
};

// Update order status (Sellers & Admins only)
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
    }

    try {
        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // If transitioning to cancelled, add back stock
        if (status === "cancelled" && order.status !== "cancelled") {
            for (const item of order.items) {
                await productModel.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }
        }

        order.status = status;
        await order.save();

        const updatedOrder = await orderModel.findById(id)
            .populate({
                path: "buyer",
                select: "fullname email contact profilePic role"
            })
            .populate({
                path: "items.product",
                select: "title price images description"
            })
            .populate({
                path: "items.size",
                select: "name"
            })
            .populate({
                path: "items.color",
                select: "name hexCode"
            });

        return res.status(200).json({ success: true, message: "Order status updated", order: updatedOrder });
    } catch (error) {
        console.error("Update order status error:", error);
        return res.status(500).json({ message: "Server error updating order status" });
    }
};
