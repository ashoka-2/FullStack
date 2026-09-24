import userModel from "../models/user.model.js";
import bugReportModel from "../models/bugreport.model.js";
import messageModel from "../models/message.model.js";
import { deleteFile } from "../services/imagekit.service.js";

// ─── Get User Settings ─────────────────────────────────────────────────────
export async function getUserSettings(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select(
            "memory preferences"
        );
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, memory: user.memory || {}, preferences: user.preferences || {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Update User Settings (memory + preferences) ──────────────────────────
export async function updateUserSettings(req, res) {
    try {
        const { memory, preferences } = req.body;
        const updateFields = {};

        if (memory !== undefined) {
            if (typeof memory.enabled === 'boolean') updateFields["memory.enabled"] = memory.enabled;
            if (memory.nickname !== undefined) updateFields["memory.nickname"] = String(memory.nickname).trim().slice(0, 100);
            if (memory.occupation !== undefined) updateFields["memory.occupation"] = String(memory.occupation).trim().slice(0, 100);
            if (memory.customInstructions !== undefined) updateFields["memory.customInstructions"] = String(memory.customInstructions).slice(0, 2000);
            if (typeof memory.librarySearchEnabled === 'boolean') updateFields["memory.librarySearchEnabled"] = memory.librarySearchEnabled;
            updateFields["memory.lastUpdated"] = new Date();
        }

        if (preferences !== undefined) {
            if (preferences.theme) updateFields["preferences.theme"] = preferences.theme;
            if (preferences.language) updateFields["preferences.language"] = preferences.language;
            if (typeof preferences.hapticFeedback === 'boolean') updateFields["preferences.hapticFeedback"] = preferences.hapticFeedback;
            if (typeof preferences.webSearchEnabled === 'boolean') updateFields["preferences.webSearchEnabled"] = preferences.webSearchEnabled;
            if (typeof preferences.safetyFilter === 'boolean') updateFields["preferences.safetyFilter"] = preferences.safetyFilter;
            if (preferences.notifications) {
                if (typeof preferences.notifications.enabled === 'boolean') updateFields["preferences.notifications.enabled"] = preferences.notifications.enabled;
                if (typeof preferences.notifications.aiResponse === 'boolean') updateFields["preferences.notifications.aiResponse"] = preferences.notifications.aiResponse;
                if (typeof preferences.notifications.systemAlerts === 'boolean') updateFields["preferences.notifications.systemAlerts"] = preferences.notifications.systemAlerts;
            }
        }

        const user = await userModel.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true, select: "memory preferences" }
        );

        res.json({ success: true, message: "Settings updated", memory: user.memory, preferences: user.preferences });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Clear Memory Facts ────────────────────────────────────────────────────
export async function clearMemory(req, res) {
    try {
        await userModel.findByIdAndUpdate(req.user.id, {
            $set: { "memory.facts": [], "memory.summary": "", "memory.lastUpdated": new Date() }
        });
        res.json({ success: true, message: "Memory cleared" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Get User Uploaded Media ───────────────────────────────────────────────
export async function getUserMedia(req, res) {
    try {
        // Find all messages by this user that contain files (images/videos)
        const chats = await (await import("../models/chat.model.js")).default
            .find({ user: req.user.id })
            .select("_id");
        const chatIds = chats.map(c => c._id);

        const messages = await messageModel.find({
            chat: { $in: chatIds },
            $or: [
                { "file.fileType": { $in: ["image", "video"] } },
                { "files.0": { $exists: true } }
            ]
        }).select("files file chat createdAt role").sort({ createdAt: -1 });

        // Flatten all media items
        const media = [];
        for (const msg of messages) {
            const allFiles = [
                ...(msg.file && (msg.file.fileType === 'image' || msg.file.fileType === 'video') ? [msg.file] : []),
                ...(msg.files || []).filter(f => f?.fileType === 'image' || f?.fileType === 'video')
            ];
            for (const f of allFiles) {
                if (f?.fileId || f?.url) {
                    media.push({
                        fileId: f.fileId || f.name,
                        url: f.url,
                        name: f.name || f.fileName || "Uploaded file",
                        fileType: f.fileType,
                        size: f.size || 0,
                        chatId: msg.chat,
                        messageId: msg._id,
                        uploadedAt: msg.createdAt
                    });
                }
            }
        }

        res.json({ success: true, media, total: media.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Delete User Media ─────────────────────────────────────────────────────
export async function deleteUserMedia(req, res) {
    try {
        const { fileId } = req.params;
        if (!fileId) return res.status(400).json({ success: false, message: "fileId is required" });

        // Verify ownership: find a message in user's chat that contains this file
        const chats = await (await import("../models/chat.model.js")).default
            .find({ user: req.user.id })
            .select("_id");
        const chatIds = chats.map(c => c._id);

        const message = await messageModel.findOne({
            chat: { $in: chatIds },
            $or: [
                { "file.fileId": fileId },
                { "files.fileId": fileId }
            ]
        });

        if (!message) {
            return res.status(404).json({ success: false, message: "File not found or not yours" });
        }

        // Delete from ImageKit
        const deleted = await deleteFile(fileId);

        // Mark as deleted in DB (replace url with deleted marker)
        if (message.file?.fileId === fileId) {
            message.file = { ...message.file, url: null, deleted: true };
        }
        if (message.files?.length) {
            message.files = message.files.map(f =>
                f.fileId === fileId ? { ...f, url: null, deleted: true } : f
            );
        }
        await message.save();

        res.json({ success: true, message: "File deleted successfully", deleted });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Submit Bug Report ─────────────────────────────────────────────────────
export async function submitBugReport(req, res) {
    try {
        const { title, description, category, severity, stepsToReproduce, expectedBehavior, actualBehavior, browserInfo } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: "Title and description are required" });
        }

        const report = await bugReportModel.create({
            user: req.user.id,
            title: title.trim().slice(0, 200),
            description: description.trim().slice(0, 5000),
            category: category || 'other',
            severity: severity || 'medium',
            stepsToReproduce: stepsToReproduce || "",
            expectedBehavior: expectedBehavior || "",
            actualBehavior: actualBehavior || "",
            browserInfo: browserInfo || ""
        });

        res.status(201).json({ success: true, message: "Bug report submitted. Thank you!", report: { id: report._id, title: report.title, status: report.status } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Admin: Get All Bug Reports ────────────────────────────────────────────
export async function getAdminBugReports(req, res) {
    try {
        const { status, severity, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (severity) filter.severity = severity;

        const reports = await bugReportModel
            .find(filter)
            .populate("user", "username email profilePic")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await bugReportModel.countDocuments(filter);
        res.json({ success: true, reports, total, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Admin: Update Bug Report Status ──────────────────────────────────────
export async function updateBugReportStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const report = await bugReportModel.findByIdAndUpdate(
            id,
            { $set: { status, adminNotes } },
            { new: true }
        );
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
