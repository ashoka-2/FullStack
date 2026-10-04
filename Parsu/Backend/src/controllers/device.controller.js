import deviceModel from "../models/device.model.js";
import deviceAuditModel from "../models/deviceAudit.model.js";
import deviceMacroModel from "../models/deviceMacro.model.js";
import { deviceOrchestratorService } from "../services/device/deviceOrchestrator.service.js";
import crypto from "crypto";
import os from "os";

// ─── Safe device serializer — NEVER exposes deviceSecret ─────────────────────
function safeDevice(device) {
    const obj = device.toObject ? device.toObject() : { ...device };
    delete obj.deviceSecret;
    delete obj.pairingToken; // legacy field guard
    return obj;
}

// ─── Auto-Register / Upsert Device by User Account ───────────────────────────
// This is the ONLY registration path. The desktop companion and mobile app call this
// automatically on launch using the user's existing JWT session — no token to copy.
export async function autoRegisterDevice(req, res) {
    try {
        const { name, deviceType, platform, userAgent, systemMetrics } = req.body;
        const userId = req.user.id;

        const effectivePlatform = platform || "windows";
        const effectiveType = deviceType || (["android", "ios"].includes(effectivePlatform) ? "mobile" : "desktop");
        const defaultName = name || (effectiveType === "mobile" ? "Mobile Phone" : "Personal Desktop");

        // Upsert: find existing device for this user + platform + type combo
        let device = await deviceModel.findOne({
            user: userId,
            platform: effectivePlatform,
            deviceType: effectiveType
        });

        if (device) {
            device.status = "online";
            device.lastSeen = new Date();
            if (name) device.name = name;
            if (systemMetrics) device.systemMetrics = { ...device.systemMetrics, ...systemMetrics };
            await device.save();
        } else {
            // Generate a cryptographically strong device secret — internal use only
            const deviceSecret = crypto.randomBytes(32).toString("hex");
            device = await deviceModel.create({
                user: userId,
                name: defaultName,
                deviceType: effectiveType,
                platform: effectivePlatform,
                deviceSecret,
                status: "online",
                systemInfo: {
                    osVersion: userAgent || "",
                    hostname: defaultName
                },
                capabilities: [
                    "app_control",
                    "input_simulation",
                    "file_system",
                    "clipboard",
                    "system_settings",
                    "screen_capture",
                    "notifications",
                    "macros",
                    "browser_control",
                    "device_sync"
                ],
                lastSeen: new Date()
            });
        }

        res.status(200).json({
            success: true,
            message: "Device auto-registered and linked to your account",
            device: safeDevice(device)
        });
    } catch (err) {
        console.error("Auto-register device error:", err);
        res.status(500).json({ success: false, message: "Failed to auto-register device", error: err.message });
    }
}

// ─── List User's Linked Devices ──────────────────────────────────────────────
export async function getDevices(req, res) {
    try {
        const devices = await deviceModel.find({ user: req.user.id }).sort({ lastSeen: -1 });

        // If no devices exist yet, silently register the current context as a device
        if (devices.length === 0) {
            const deviceSecret = crypto.randomBytes(32).toString("hex");
            const autoDevice = await deviceModel.create({
                user: req.user.id,
                name: `${os.hostname()} (Workstation)`,
                deviceType: "desktop",
                platform: "windows",
                deviceSecret,
                status: "online",
                capabilities: [
                    "app_control",
                    "input_simulation",
                    "file_system",
                    "clipboard",
                    "system_settings",
                    "screen_capture",
                    "screen_vision_ocr",
                    "notifications",
                    "macros",
                    "browser_control",
                    "device_sync"
                ],
                systemInfo: {
                    hostname: os.hostname(),
                    osVersion: os.release(),
                    totalMemoryBytes: os.totalmem(),
                    freeMemoryBytes: os.freemem(),
                    displaysCount: 1
                },
                lastSeen: new Date()
            });
            return res.json({ success: true, devices: [safeDevice(autoDevice)] });
        }

        res.json({ success: true, devices: devices.map(safeDevice) });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch devices", error: err.message });
    }
}

// ─── Get Device Details ──────────────────────────────────────────────────────
export async function getDeviceById(req, res) {
    try {
        const { deviceId } = req.params;
        const device = await deviceModel.findOne({ _id: deviceId, user: req.user.id });
        if (!device) return res.status(404).json({ success: false, message: "Device not found" });
        res.json({ success: true, device: safeDevice(device) });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to get device", error: err.message });
    }
}

// ─── Rename Device ───────────────────────────────────────────────────────────
export async function renameDevice(req, res) {
    try {
        const { deviceId } = req.params;
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ success: false, message: "Name is required" });

        const device = await deviceModel.findOneAndUpdate(
            { _id: deviceId, user: req.user.id },
            { name: name.trim() },
            { returnDocument: 'after' }
        );
        if (!device) return res.status(404).json({ success: false, message: "Device not found" });
        res.json({ success: true, message: "Device renamed", device: safeDevice(device) });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to rename device", error: err.message });
    }
}

// ─── Set Default Device ──────────────────────────────────────────────────────
export async function setDefaultDevice(req, res) {
    try {
        const { deviceId } = req.params;
        await deviceModel.updateMany({ user: req.user.id }, { isDefault: false });
        const device = await deviceModel.findOneAndUpdate(
            { _id: deviceId, user: req.user.id },
            { isDefault: true },
            { returnDocument: 'after' }
        );
        if (!device) return res.status(404).json({ success: false, message: "Device not found" });
        res.json({ success: true, message: `"${device.name}" set as default device`, device: safeDevice(device) });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to set default device", error: err.message });
    }
}

// ─── Unlink / Remove Device — revokes credential and drops relay connection ──
export async function unpairDevice(req, res) {
    try {
        const { deviceId } = req.params;
        const device = await deviceModel.findOneAndDelete({ _id: deviceId, user: req.user.id });
        if (!device) return res.status(404).json({ success: false, message: "Device not found" });
        res.json({ success: true, message: `Device "${device.name}" unlinked from your account` });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to unlink device", error: err.message });
    }
}

// ─── Execute Command on Device ───────────────────────────────────────────────
export async function executeDeviceCommand(req, res) {
    try {
        const { targetSelector, action, params, socketId, confirmed } = req.body;
        if (!action) {
            return res.status(400).json({ success: false, message: "Action parameter is required" });
        }

        const result = await deviceOrchestratorService.executeCommand({
            userId: req.user.id,
            targetSelector,
            action,
            params: params || {},
            socketId,
            confirmed: Boolean(confirmed)
        });

        res.json({ success: true, ...result });
    } catch (err) {
        console.error("Execute device command error:", err);
        res.status(500).json({ success: false, message: err.message, error: err.message });
    }
}

// ─── Confirm Pending Action (Mutating / Destructive) ─────────────────────────
export async function confirmAction(req, res) {
    try {
        const { auditId } = req.params;
        const audit = await deviceAuditModel.findOne({ _id: auditId, user: req.user.id });
        if (!audit) return res.status(404).json({ success: false, message: "Pending action not found" });

        if (audit.status !== "pending_confirmation") {
            return res.status(400).json({ success: false, message: `Action status is already '${audit.status}'` });
        }

        const result = await deviceOrchestratorService.executeCommand({
            userId: req.user.id,
            targetSelector: audit.device?.toString(),
            action: audit.action,
            params: audit.details || {},
            socketId: req.body.socketId,
            confirmed: true
        });

        res.json({ success: true, message: "Action confirmed and executed", ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to confirm action", error: err.message });
    }
}

// ─── Undo Executed Action ─────────────────────────────────────────────────────
export async function undoAction(req, res) {
    try {
        const { auditId } = req.params;
        const result = await deviceOrchestratorService.undoAction(req.user.id, auditId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Get Audit Logs ──────────────────────────────────────────────────────────
export async function getAuditLogs(req, res) {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 30;
        const skip = (page - 1) * limit;

        const query = { user: req.user.id };
        if (req.query.device) query.device = req.query.device;
        if (req.query.tier) query.tier = req.query.tier;
        if (req.query.status) query.status = req.query.status;

        const [logs, total] = await Promise.all([
            deviceAuditModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            deviceAuditModel.countDocuments(query)
        ]);

        res.json({ success: true, logs, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch audit logs", error: err.message });
    }
}

// ─── Macros ──────────────────────────────────────────────────────────────────
export async function getMacros(req, res) {
    try {
        const macros = await deviceMacroModel.find({ user: req.user.id }).sort({ updatedAt: -1 });
        res.json({ success: true, macros });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch macros", error: err.message });
    }
}

export async function createMacro(req, res) {
    try {
        const { name, description, targetDevice, steps, schedule } = req.body;
        if (!name || !steps || steps.length === 0) {
            return res.status(400).json({ success: false, message: "Name and at least 1 step required" });
        }
        const macro = await deviceMacroModel.create({
            user: req.user.id,
            name,
            description,
            targetDevice,
            steps,
            schedule: schedule || { enabled: false }
        });
        res.status(201).json({ success: true, message: "Macro created", macro });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to create macro", error: err.message });
    }
}

export async function runMacro(req, res) {
    try {
        const { macroId } = req.params;
        const macro = await deviceMacroModel.findOne({ _id: macroId, user: req.user.id });
        if (!macro) return res.status(404).json({ success: false, message: "Macro not found" });

        const results = await deviceOrchestratorService.executeChainedPipeline({
            userId: req.user.id,
            steps: macro.steps.map(s => ({
                action: s.action,
                target: s.target || macro.targetDevice?.toString(),
                params: s.params,
                confirmed: true
            })),
            socketId: req.body.socketId
        });

        macro.lastRunAt = new Date();
        macro.runCount += 1;
        await macro.save();

        res.json({ success: true, message: `Macro "${macro.name}" executed`, results });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to run macro", error: err.message });
    }
}

// ─── Device Heartbeat (REST fallback for SW background sync) ─────────────────
export async function deviceHeartbeat(req, res) {
    try {
        const { systemMetrics } = req.body;
        // Update the user's default or most-recently-seen device
        const device = await deviceModel.findOne(
            { user: req.user.id, status: 'online' },
            null,
            { sort: { lastSeen: -1 } }
        );
        if (device) {
            device.lastSeen = new Date();
            if (systemMetrics) device.systemMetrics = { ...device.systemMetrics, ...systemMetrics };
            await device.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Clipboard Sync ──────────────────────────────────────────────────────────
export async function syncClipboard(req, res) {
    try {
        const { text, sourceDeviceId, targetDeviceId } = req.body;
        if (!text) return res.status(400).json({ success: false, message: "Clipboard text required" });

        const target = await deviceOrchestratorService.resolveTargetDevice(req.user.id, targetDeviceId);
        const result = await deviceOrchestratorService.executeCommand({
            userId: req.user.id,
            targetSelector: target._id.toString(),
            action: "set_clipboard",
            params: { text },
            confirmed: true
        });

        res.json({ success: true, message: `Clipboard synced to ${target.name}`, result });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to sync clipboard", error: err.message });
    }
}

