import { Request, Response } from "express";
import Message from "../models/message.model.js";
import { broadcastUpdate } from "../services/socket.service.js";

// @desc    Submit contact form or newsletter signup
// @route   POST /api/messages
// @access  Public
export const createMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, name, email, subject, content } = req.body;
        if (!email || !type) {
            res.status(400).json({ success: false, message: "Email and type are required." });
            return;
        }

        const message = await Message.create({ type, name, email, subject, content });

        // ⚡ Instantly notify admin panel via Socket.io
        broadcastUpdate("new_message", message.toObject());

        res.status(201).json({ success: true, message: "Message received. Thank you!" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private/Admin
export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({ isRead: false });
        res.status(200).json({ success: true, messages, unreadCount });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private/Admin
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { isRead: true });
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private/Admin
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await Message.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Message deleted." });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
