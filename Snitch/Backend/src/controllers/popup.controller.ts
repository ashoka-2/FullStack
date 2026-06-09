import { Request, Response } from "express";
import popupModel from "../models/popup.model.js";
import { uploadFile } from "../services/imagekit.service.js";
import { broadcastUpdate } from "../services/socket.service.js";

// @desc    Get active popups (Public)
// @route   GET /api/popups/active
// @access  Public
export const getActivePopups = async (req: Request, res: Response): Promise<void> => {
    try {
        const popups = await popupModel.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, popups });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all popups (Admin only)
// @route   GET /api/popups
// @access  Private/Admin
export const getPopups = async (req: Request, res: Response): Promise<void> => {
    try {
        const popups = await popupModel.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, popups });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a popup (Admin only)
// @route   POST /api/popups
// @access  Private/Admin
export const createPopup = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            title,
            text,
            textColor,
            fontSize,
            fontWeight,
            textAlign,
            backgroundColor,
            gradientColor,
            gradientDirection,
            isGradient,
            size,
            borderRadius,
            linkUrl,
            isActive,
            isDraft,
            imageFilter,
            imageUrl,
            metadata,
            displayTime,
        } = req.body;

        let finalImageUrl = imageUrl || "";

        // Handle image upload from file if present
        if (req.file) {
            const uploaded = await uploadFile({
                file: req.file.buffer,
                filename: req.file.originalname,
                folder: "/snitch/popups"
            });
            finalImageUrl = uploaded.url;
        }

        // Parse image filter from body if it's sent as stringified JSON
        let parsedFilter = { blur: 0, brightness: 100, contrast: 100, grayscale: 0, sepia: 0 };
        if (imageFilter) {
            try {
                parsedFilter = typeof imageFilter === "string" ? JSON.parse(imageFilter) : imageFilter;
            } catch (e) {
                console.error("Error parsing image filter:", e);
            }
        }

        const newPopup = await popupModel.create({
            title,
            imageUrl: finalImageUrl,
            imageFilter: parsedFilter,
            text,
            textColor,
            fontSize,
            fontWeight,
            textAlign,
            backgroundColor,
            gradientColor,
            gradientDirection,
            isGradient: isGradient === "true" || isGradient === true,
            size,
            borderRadius,
            linkUrl,
            isActive: isActive === "true" || isActive === true,
            isDraft: isDraft === "true" || isDraft === true,
            metadata,
            displayTime: Number(displayTime) || 5,
        });

        // Broadcast to all clients if it is published immediately
        if (newPopup.isActive) {
            broadcastUpdate("popup_update");
        }

        res.status(201).json({ success: true, popup: newPopup });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a popup (Admin only)
// @route   PUT /api/popups/:id
// @access  Private/Admin
export const updatePopup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const popup = await popupModel.findById(id);
        if (!popup) {
            res.status(404).json({ success: false, message: "Popup not found" });
            return;
        }

        const updateData: any = { ...req.body };

        // Handle file upload
        if (req.file) {
            const uploaded = await uploadFile({
                file: req.file.buffer,
                filename: req.file.originalname,
                folder: "/snitch/popups"
            });
            updateData.imageUrl = uploaded.url;
        }

        // Parse image filter if stringified
        if (updateData.imageFilter) {
            try {
                updateData.imageFilter = typeof updateData.imageFilter === "string" 
                    ? JSON.parse(updateData.imageFilter) 
                    : updateData.imageFilter;
            } catch (e) {
                console.error("Error parsing image filter on update:", e);
            }
        }

        // Convert strings to booleans
        if (updateData.isGradient !== undefined) {
            updateData.isGradient = updateData.isGradient === "true" || updateData.isGradient === true;
        }
        if (updateData.isActive !== undefined) {
            updateData.isActive = updateData.isActive === "true" || updateData.isActive === true;
        }
        if (updateData.isDraft !== undefined) {
            updateData.isDraft = updateData.isDraft === "true" || updateData.isDraft === true;
        }
        if (updateData.displayTime !== undefined) {
            updateData.displayTime = Number(updateData.displayTime) || 5;
        }

        const updatedPopup = await popupModel.findByIdAndUpdate(id, updateData, { new: true });

        // Broadcast change in real-time
        broadcastUpdate("popup_update");

        res.status(200).json({ success: true, popup: updatedPopup });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a popup (Admin only)
// @route   DELETE /api/popups/:id
// @access  Private/Admin
export const deletePopup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const popup = await popupModel.findById(id);
        if (!popup) {
            res.status(404).json({ success: false, message: "Popup not found" });
            return;
        }

        await popupModel.findByIdAndDelete(id);

        // Broadcast update
        broadcastUpdate("popup_update");

        res.status(200).json({ success: true, message: "Popup deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle popup status (Admin only)
// @route   PATCH /api/popups/:id/toggle
// @access  Private/Admin
export const togglePopupStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const popup = await popupModel.findById(id);
        if (!popup) {
            res.status(404).json({ success: false, message: "Popup not found" });
            return;
        }

        popup.isActive = !popup.isActive;
        popup.isDraft = false; // toggling means it's no longer a pure draft
        await popup.save();

        // Broadcast changes in real-time
        broadcastUpdate("popup_update");

        res.status(200).json({ success: true, popup });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
