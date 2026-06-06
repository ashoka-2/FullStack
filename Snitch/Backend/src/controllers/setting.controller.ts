import { Request, Response } from "express";
import SiteSettings from "../models/setting.model.js";
import { broadcastUpdate } from "../services/socket.service.js";

// @desc    Get site settings
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        let settings = await SiteSettings.findOne();
        if (!settings) {
            settings = await SiteSettings.create({}); // Creates default settings
        }
        res.status(200).json({ success: true, settings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        let settings = await SiteSettings.findOne();
        if (!settings) {
            settings = new SiteSettings(req.body);
        } else {
            const currentSettings = settings.toObject();
            if (req.body.about) {
                settings.about = { ...currentSettings.about, ...req.body.about };
            }
            if (req.body.contact) {
                settings.contact = { ...currentSettings.contact, ...req.body.contact };
            }
            if (req.body.footer) {
                settings.footer = { ...currentSettings.footer, ...req.body.footer };
            }
        }
        await settings.save();

        // ⚡ Broadcast to all connected clients immediately
        broadcastUpdate("settings_update", settings.toObject());

        res.status(200).json({ success: true, settings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
