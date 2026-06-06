import { Request, Response } from "express";
import SiteSettings, { AboutSetting, ContactSetting, FooterSetting, LegalSetting } from "../models/setting.model.js";
import { broadcastUpdate } from "../services/socket.service.js";

// Helper function to ensure all sub-settings documents exist and are connected
async function getPopulatedSettings() {
    let settings = await SiteSettings.findOne();
    if (!settings) {
        const about = await AboutSetting.create({});
        const contact = await ContactSetting.create({});
        const footer = await FooterSetting.create({});
        const legal = await LegalSetting.create({});
        settings = await SiteSettings.create({
            about: about._id,
            contact: contact._id,
            footer: footer._id,
            legal: legal._id
        });
    } else {
        // Migration check to ensure existing settings document references exist
        let modified = false;
        if (!settings.about) {
            const about = await AboutSetting.create({});
            settings.about = about._id as any;
            modified = true;
        }
        if (!settings.contact) {
            const contact = await ContactSetting.create({});
            settings.contact = contact._id as any;
            modified = true;
        }
        if (!settings.footer) {
            const footer = await FooterSetting.create({});
            settings.footer = footer._id as any;
            modified = true;
        }
        if (!settings.legal) {
            const legal = await LegalSetting.create({});
            settings.legal = legal._id as any;
            modified = true;
        }
        if (modified) {
            await settings.save();
        }
    }
    return await SiteSettings.findOne()
        .populate("about")
        .populate("contact")
        .populate("footer")
        .populate("legal");
}

// @desc    Get site settings
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await getPopulatedSettings();
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
        const settings = await getPopulatedSettings();
        if (!settings) {
            res.status(404).json({ success: false, message: "Settings not initialized" });
            return;
        }

        if (req.body.about) {
            await AboutSetting.findByIdAndUpdate((settings.about as any)._id, req.body.about, { new: true });
        }
        if (req.body.contact) {
            await ContactSetting.findByIdAndUpdate((settings.contact as any)._id, req.body.contact, { new: true });
        }
        if (req.body.footer) {
            await FooterSetting.findByIdAndUpdate((settings.footer as any)._id, req.body.footer, { new: true });
        }
        if (req.body.legal) {
            await LegalSetting.findByIdAndUpdate((settings.legal as any)._id, req.body.legal, { new: true });
        }

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update about page settings
// @route   PUT /api/settings/about
// @access  Private/Admin
export const updateAboutSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            res.status(404).json({ success: false, message: "Settings not initialized" });
            return;
        }

        await AboutSetting.findByIdAndUpdate(
            (settings.about as any)._id,
            req.body,
            { new: true, runValidators: true }
        );

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update contact settings
// @route   PUT /api/settings/contact
// @access  Private/Admin
export const updateContactSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            res.status(404).json({ success: false, message: "Settings not initialized" });
            return;
        }

        await ContactSetting.findByIdAndUpdate(
            (settings.contact as any)._id,
            req.body,
            { new: true, runValidators: true }
        );

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update footer settings
// @route   PUT /api/settings/footer
// @access  Private/Admin
export const updateFooterSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            res.status(404).json({ success: false, message: "Settings not initialized" });
            return;
        }

        await FooterSetting.findByIdAndUpdate(
            (settings.footer as any)._id,
            req.body,
            { new: true, runValidators: true }
        );

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update legal settings
// @route   PUT /api/settings/legal
// @access  Private/Admin
export const updateLegalSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            res.status(404).json({ success: false, message: "Settings not initialized" });
            return;
        }

        await LegalSetting.findByIdAndUpdate(
            (settings.legal as any)._id,
            req.body,
            { new: true, runValidators: true }
        );

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update privacy policy settings
// @route   PUT /api/settings/legal/privacy
// @access  Private/Admin
export const updatePrivacyPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            res.status(404).json({ success: false, message: "Settings not initialized" });
            return;
        }

        const { privacyPolicy } = req.body;
        await LegalSetting.findByIdAndUpdate(
            (settings.legal as any)._id,
            { privacyPolicy },
            { new: true, runValidators: true }
        );

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update return policy settings
// @route   PUT /api/settings/legal/returns
// @access  Private/Admin
export const updateReturnPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            res.status(404).json({ success: false, message: "Settings not initialized" });
            return;
        }

        const { returnPolicy } = req.body;
        await LegalSetting.findByIdAndUpdate(
            (settings.legal as any)._id,
            { returnPolicy },
            { new: true, runValidators: true }
        );

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update terms of service settings
// @route   PUT /api/settings/legal/terms
// @access  Private/Admin
export const updateTermsOfService = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            res.status(404).json({ success: false, message: "Settings not initialized" });
            return;
        }

        const { termsOfService } = req.body;
        await LegalSetting.findByIdAndUpdate(
            (settings.legal as any)._id,
            { termsOfService },
            { new: true, runValidators: true }
        );

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

