import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import orderModel from "../models/order.model.js";
import orderSubModel from "../models/orderSub.model.js";
import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import placeModel from "../models/place.model.js";
import { broadcastUpdate } from "../services/socket.service.js";

// Helper to deeply populate a single order with its OrderSub child items
const getPopulatedOrder = async (orderId: string) => {
    const order = await orderModel.findById(orderId).populate({
        path: "buyer",
        select: "fullname email contact profilePic role"
    });
    if (!order) return null;

    const items = await orderSubModel.find({ order: orderId })
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

    const orderObj = order.toObject() as any;
    orderObj.items = items;
    return orderObj;
};

// Place order — wrapped in a MongoDB transaction to prevent race conditions
export const createOrder = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { shippingAddress, contactNumber, items: customItems } = req.body;

    // Start a Mongoose session for atomic transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const orderItems: any[] = [];
        let totalAmount = 0;

        // Fetch address from User's Place model if not provided
        let resolvedAddress = shippingAddress;
        if (!resolvedAddress) {
            const userPlace = await placeModel.findOne({ user: userId }).session(session);
            if (!userPlace) {
                await session.abortTransaction();
                session.endSession();
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

        const itemsToProcess = customItems && customItems.length > 0
            ? customItems
            : (() => {
                // Handled below via cart fetch
                return null;
            })();

        if (itemsToProcess) {
            // Process custom items (buy-now flow)
            for (const item of itemsToProcess) {
                // Prevent seller from buying their own products
                const checkProd = await productModel.findById(item.product).session(session);
                if (checkProd && checkProd.seller.toString() === userId) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ message: `You cannot purchase your own product: "${checkProd.title}"` });
                }

                // ── Atomic stock deduction ──────────────────────────────────────
                // findOneAndUpdate with $gte filter: only succeeds if stock >= quantity
                // This is race-condition safe — no separate read-then-write
                const updatedProduct = await productModel.findOneAndUpdate(
                    { _id: item.product, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { new: true, session }
                );

                if (!updatedProduct) {
                    // Stock was insufficient (either 0 or another request grabbed it first)
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({
                        message: `Insufficient stock for product. Someone else may have just purchased it.`
                    });
                }

                const price = updatedProduct.price.saleAmount || updatedProduct.price.amount;
                orderItems.push({
                    product: item.product,
                    size: item.size || null,
                    color: item.color || null,
                    quantity: item.quantity,
                    price
                });
                totalAmount += price * item.quantity;
            }
        } else {
            // Check out using Cart
            const cart = await cartModel.findOne({ user: userId }).populate("items.product").session(session);
            if (!cart || cart.items.length === 0) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: "Your cart is empty" });
            }

            for (const item of cart.items) {
                const productObj = item.product as any;
                if (!productObj) continue;

                // Prevent seller from buying their own products
                if (productObj.seller && productObj.seller.toString() === userId) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ message: `You cannot purchase your own product: "${productObj.title}"` });
                }

                // ── Atomic stock deduction ──────────────────────────────────────
                const updatedProduct = await productModel.findOneAndUpdate(
                    { _id: productObj._id, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { new: true, session }
                );

                if (!updatedProduct) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({
                        message: `Insufficient stock for "${productObj.title}". Someone else may have just purchased it.`
                    });
                }

                const price = updatedProduct.price.saleAmount || updatedProduct.price.amount;
                orderItems.push({
                    product: productObj._id,
                    size: item.size || null,
                    color: item.color || null,
                    quantity: item.quantity,
                    price
                });
                totalAmount += price * item.quantity;
            }
        }

        if (orderItems.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "No items to order" });
        }

        // Create the parent metadata Order record (inside transaction)
        const [newOrder] = await orderModel.create([{
            buyer: userId,
            totalAmount,
            shippingAddress: resolvedAddress,
            contactNumber: resolvedContact,
            status: "pending",
            paymentStatus: "paid",
        }], { session });

        // Create normalized children OrderSub records (inside transaction)
        const createdOrder = newOrder as any;
        const subItems = orderItems.map(item => ({
            order: createdOrder._id,
            product: item.product,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.price
        }));
        await orderSubModel.insertMany(subItems, { session });

        // Clear cart if ordered from cart (inside transaction)
        if (!customItems || customItems.length === 0) {
            await cartModel.findOneAndUpdate({ user: userId }, { items: [] }, { session });
        }

        // ── Commit transaction — all-or-nothing ─────────────────────────────
        await session.commitTransaction();
        session.endSession();

        broadcastUpdate("order_update");
        broadcastUpdate("cart_update");

        const populatedOrder = await getPopulatedOrder((newOrder as any)._id.toString());

        return res.status(201).json({ success: true, message: "Order placed successfully", order: populatedOrder });
    } catch (error) {
        // Rollback everything if any step fails
        await session.abortTransaction();
        session.endSession();
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
        const orders = await orderModel.find({ buyer: userId }).sort({ createdAt: -1 });
        const orderIds = orders.map(o => o._id);

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

        const enrichedOrders = orders.map(o => {
            const orderObj = o.toObject() as any;
            orderObj.items = allSubs.filter(sub => sub.order.toString() === orderObj._id.toString());
            return orderObj;
        });

        return res.status(200).json({ success: true, orders: enrichedOrders });
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
            .sort({ createdAt: -1 });

        const orderIds = orders.map(o => o._id);
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
            .populate({
                path: "size",
                select: "name"
            })
            .populate({
                path: "color",
                select: "name hexCode"
            });

        const enrichedOrders = orders.map(o => {
            const orderObj = o.toObject() as any;
            orderObj.items = allSubs.filter(sub => sub.order.toString() === orderObj._id.toString());
            return orderObj;
        });

        return res.status(200).json({ success: true, orders: enrichedOrders });
    } catch (error) {
        console.error("Get all orders error:", error);
        return res.status(500).json({ message: "Server error fetching orders list" });
    }
};

// Update order status (Sellers & Admins only)
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ["pending", "processing", "shipped", "delivered", "cancelled", "returned"];
    if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
    }

    try {
        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // If transitioning to cancelled, add back stock atomically
        if (status === "cancelled" && order.status !== "cancelled") {
            const subItems = await orderSubModel.find({ order: id as any });
            for (const item of subItems) {
                await productModel.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }
        }

        order.status = status;
        await order.save();
        broadcastUpdate("order_update");

        const updatedOrder = await getPopulatedOrder(id as string);

        return res.status(200).json({ success: true, message: "Order status updated", order: updatedOrder });
    } catch (error) {
        console.error("Update order status error:", error);
        return res.status(500).json({ message: "Server error updating order status" });
    }
};

// Cancel or return order (Buyer only)
export const cancelOrReturnOrder = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { action } = req.body; // "cancel" or "return"

    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.buyer.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to update this order" });
        }

        const subItems = await orderSubModel.find({ order: id as any });

        if (action === "cancel") {
            if (order.status !== "pending" && order.status !== "processing") {
                return res.status(400).json({ message: "Order can only be cancelled when pending or processing" });
            }
            for (const item of subItems) {
                await productModel.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }
            order.status = "cancelled";
        } else if (action === "return") {
            if (order.status !== "shipped" && order.status !== "delivered") {
                return res.status(400).json({ message: "Order can only be returned when shipped or delivered" });
            }
            for (const item of subItems) {
                await productModel.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }
            order.status = "returned";
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }

        await order.save();
        broadcastUpdate("order_update");

        const updatedOrder = await getPopulatedOrder(id as string);

        return res.status(200).json({ 
            success: true, 
            message: `Order has been ${action === "cancel" ? "cancelled" : "returned"} successfully`, 
            order: updatedOrder 
        });
    } catch (error) {
        console.error("Cancel/return order error:", error);
        return res.status(500).json({ message: "Server error processing order cancel/return request" });
    }
};
