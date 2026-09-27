import deviceModel from "../../models/device.model.js";
import deviceAuditModel from "../../models/deviceAudit.model.js";
import { desktopWindowsService } from "./desktopWindows.service.js";
import { mobileCompanionService } from "./mobileCompanion.service.js";
import { getIO } from "../../sockets/server.socket.js";
import os from "os";

// ── Action Tier Classification ──────────────────────────────────────────────
export const ACTION_TIERS = {
    // Read-Only (Auto-run)
    list_processes: "read-only",
    get_metrics: "read-only",
    get_displays: "read-only",
    search_files: "read-only",
    read_file: "read-only",
    get_clipboard: "read-only",
    capture_screenshot: "read-only",
    
    // Mutating (Confirm once per session)
    launch_app: "mutating",
    focus_window: "mutating",
    simulate_click: "mutating",
    simulate_type: "mutating",
    write_file: "mutating",
    set_clipboard: "mutating",
    set_volume: "mutating",
    set_brightness: "mutating",
    send_notification: "mutating",
    open_browser_url: "mutating",
    sync_clipboard: "mutating",

    // Destructive (Always requires explicit user confirmation)
    close_process: "destructive",
    delete_file: "destructive",
    power_sleep: "destructive",
    power_restart: "destructive",
    power_shutdown: "destructive",
    send_external_message: "destructive"
};

export function getActionTier(action) {
    return ACTION_TIERS[action] || "mutating";
}

/**
 * Emit live itemized execution step to the user's active socket
 */
function emitLiveStep(socketId, step) {
    if (!socketId) return;
    try {
        const io = getIO();
        io.to(socketId).emit("device_action_step", {
            ...step,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.warn("⚠️ Socket step emit error:", err.message);
    }
}

export const deviceOrchestratorService = {
    /**
     * Resolve target device based on user preference, device ID, or natural language hints
     */
    async resolveTargetDevice(userId, targetSelector = null) {
        const userDevices = await deviceModel.find({ user: userId }).sort({ lastSeen: -1 });
        if (userDevices.length === 0) {
            // Auto-provision local host Windows companion device if running on local desktop
            if (process.platform === "win32") {
                const autoDevice = await deviceModel.create({
                    user: userId,
                    name: `${os.hostname()} (Local Desktop)`,
                    deviceType: "desktop",
                    platform: "windows",
                    pairingToken: `psu_dev_local_${Date.now()}`,
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
                    }
                });
                return autoDevice;
            }
            throw new Error("No paired devices found. Please pair your Windows desktop or mobile companion in Settings > Devices.");
        }

        // Direct device ID match
        if (targetSelector && targetSelector.length === 24) {
            const found = userDevices.find(d => d._id.toString() === targetSelector);
            if (found) return found;
        }

        // Name or Type match
        if (typeof targetSelector === "string") {
            const lower = targetSelector.toLowerCase();
            const matched = userDevices.find(d => 
                d.deviceType.toLowerCase() === lower ||
                d.platform.toLowerCase() === lower ||
                d.name.toLowerCase().includes(lower)
            );
            if (matched) return matched;
        }

        // Prefer online desktop first, then online mobile, then most recent device
        const onlineDesktop = userDevices.find(d => d.status === "online" && d.deviceType === "desktop");
        if (onlineDesktop) return onlineDesktop;

        const onlineAny = userDevices.find(d => d.status === "online");
        if (onlineAny) return onlineAny;

        return userDevices[0];
    },

    /**
     * Execute a device command with tiered safety, live step streaming, and audit logging
     */
    async executeCommand({
        userId,
        targetSelector = null,
        action,
        params = {},
        socketId = null,
        confirmed = false
    }) {
        const startTime = Date.now();
        const tier = getActionTier(action);
        const device = await this.resolveTargetDevice(userId, targetSelector);

        // 1. Safety & Permission Check
        const requiresConfirmation = tier === "destructive" || (tier === "mutating" && !device.sessionApprovedMutating);
        if (requiresConfirmation && !confirmed) {
            // Create pending audit record for user approval
            const audit = await deviceAuditModel.create({
                user: userId,
                device: device._id,
                deviceName: device.name,
                platform: device.platform,
                action,
                tier,
                status: "pending_confirmation",
                details: params
            });

            emitLiveStep(socketId, {
                stepId: `step_${audit._id}`,
                deviceId: device._id,
                deviceName: device.name,
                label: `Awaiting approval for ${tier.toUpperCase()} action: ${action}`,
                status: "pending_confirmation",
                auditId: audit._id,
                tier
            });

            return {
                requiresConfirmation: true,
                auditId: audit._id,
                action,
                tier,
                device: { id: device._id, name: device.name, platform: device.platform },
                message: `This action is classified as '${tier}'. Please confirm execution.`
            };
        }

        // 2. Start Live Step Notification
        emitLiveStep(socketId, {
            stepId: `exec_${Date.now()}`,
            deviceId: device._id,
            deviceName: device.name,
            label: `Executing [${action}] on ${device.name}`,
            status: "running",
            tier
        });

        let result = null;
        let canUndo = false;
        let undoPayload = null;

        try {
            // 3. Dispatch to Platform Handler
            if (device.platform === "windows" && (process.platform === "win32" || device.localServiceUrl)) {
                switch (action) {
                    case "list_processes":
                        result = await desktopWindowsService.listProcesses(params.limit);
                        break;
                    case "launch_app":
                        result = await desktopWindowsService.launchApp(params.appOrPath, params.args);
                        break;
                    case "close_process":
                        result = await desktopWindowsService.closeProcess(params.processIdOrName, params.force);
                        break;
                    case "focus_window":
                        result = await desktopWindowsService.focusWindow(params.windowTitleOrProcess);
                        break;
                    case "get_displays":
                        result = await desktopWindowsService.getDisplayInfo();
                        break;
                    case "simulate_click":
                        result = await desktopWindowsService.simulateClick(params.x, params.y, params.button, params.doubleClick);
                        break;
                    case "simulate_type":
                        result = await desktopWindowsService.simulateType(params.text);
                        break;
                    case "search_files":
                        result = await desktopWindowsService.searchFiles(params.searchTerm, params.startDir, params.maxResults);
                        break;
                    case "read_file":
                        result = await desktopWindowsService.readFile(params.filePath, params.maxBytes);
                        break;
                    case "write_file":
                        result = await desktopWindowsService.writeFile(params.filePath, params.content);
                        canUndo = result.canUndo;
                        undoPayload = result.undoPayload;
                        break;
                    case "delete_file":
                        result = await desktopWindowsService.deleteFileSafe(params.targetPath);
                        canUndo = Boolean(result.recycled);
                        undoPayload = { targetPath: params.targetPath, action: "restore_recycle_bin" };
                        break;
                    case "get_clipboard":
                        result = await desktopWindowsService.getClipboard();
                        break;
                    case "set_clipboard":
                        result = await desktopWindowsService.setClipboard(params.text);
                        break;
                    case "get_metrics":
                        result = await desktopWindowsService.getSystemMetrics();
                        break;
                    case "set_volume":
                        result = await desktopWindowsService.setVolume(params.levelPercent);
                        break;
                    case "set_brightness":
                        result = await desktopWindowsService.setBrightness(params.percent);
                        break;
                    case "capture_screenshot":
                        result = await desktopWindowsService.captureScreenshot(params.bounds);
                        break;
                    case "send_notification":
                        result = await desktopWindowsService.sendNotification(params.title, params.message);
                        break;
                    case "open_browser_url":
                        result = await desktopWindowsService.openBrowserUrl(params.targetUrl);
                        break;
                    default:
                        throw new Error(`Unsupported desktop action: ${action}`);
                }
            } else if (device.platform === "android" || device.platform === "ios") {
                const formatted = mobileCompanionService.formatCommandPayload(device, action, params);
                // Dispatch command packet to Mobile Companion via Socket.IO
                const io = getIO();
                io.emit(`mobile_cmd:${device.pairingToken}`, formatted);
                result = { dispatched: true, commandId: formatted.commandId, platform: device.platform };
            } else {
                throw new Error(`Device platform '${device.platform}' is currently not connected or reachable.`);
            }

            const duration = Date.now() - startTime;

            // 4. Record Audit Log
            const audit = await deviceAuditModel.create({
                user: userId,
                device: device._id,
                deviceName: device.name,
                platform: device.platform,
                action,
                tier,
                status: "executed",
                details: params,
                result,
                executionTimeMs: duration,
                canUndo,
                undoPayload
            });

            // If session approved was mutating, mark on device model
            if (tier === "mutating" && !device.sessionApprovedMutating) {
                await deviceModel.updateOne({ _id: device._id }, { $set: { sessionApprovedMutating: true } });
            }

            emitLiveStep(socketId, {
                stepId: `exec_done_${Date.now()}`,
                deviceId: device._id,
                deviceName: device.name,
                label: `Completed [${action}] in ${duration}ms`,
                status: "completed",
                tier,
                duration
            });

            return {
                success: true,
                auditId: audit._id,
                device: { id: device._id, name: device.name, platform: device.platform },
                action,
                tier,
                executionTimeMs: duration,
                canUndo,
                result
            };
        } catch (err) {
            const duration = Date.now() - startTime;
            await deviceAuditModel.create({
                user: userId,
                device: device._id,
                deviceName: device.name,
                platform: device.platform,
                action,
                tier,
                status: "failed",
                details: params,
                result: { error: err.message },
                executionTimeMs: duration
            });

            emitLiveStep(socketId, {
                stepId: `exec_err_${Date.now()}`,
                deviceId: device._id,
                deviceName: device.name,
                label: `Failed: ${err.message}`,
                status: "failed",
                tier
            });

            throw err;
        }
    },

    /**
     * Cross-Device Chained Execution
     * Runs ordered steps across different paired devices
     * Example: "Copy text on desktop, then open note on mobile"
     */
    async executeChainedPipeline({ userId, steps = [], socketId = null }) {
        const results = [];
        let pipelineData = {};

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            emitLiveStep(socketId, {
                stepId: `chain_step_${i + 1}`,
                label: `Pipeline Step ${i + 1}/${steps.length}: [${step.action}] on ${step.target || 'auto device'}`,
                status: "running"
            });

            // Inject previous step data into params if templated
            const resolvedParams = { ...step.params };
            for (const [k, v] of Object.entries(resolvedParams)) {
                if (typeof v === "string" && v.startsWith("$prev.")) {
                    const field = v.replace("$prev.", "");
                    resolvedParams[k] = pipelineData[field] || v;
                }
            }

            const stepResult = await this.executeCommand({
                userId,
                targetSelector: step.target,
                action: step.action,
                params: resolvedParams,
                socketId,
                confirmed: step.confirmed || false
            });

            results.push(stepResult);
            if (stepResult.result) {
                pipelineData = { ...pipelineData, ...stepResult.result };
            }
        }

        return {
            success: true,
            totalSteps: steps.length,
            results
        };
    },

    /**
     * Revert / Undo a previously executed mutating or destructive action
     */
    async undoAction(userId, auditId) {
        const audit = await deviceAuditModel.findOne({ _id: auditId, user: userId });
        if (!audit) throw new Error("Audit log entry not found");
        if (!audit.canUndo || !audit.undoPayload) {
            throw new Error("This action does not support automated undo.");
        }

        const { undoPayload } = audit;
        if (undoPayload.action === "revert_content") {
            await desktopWindowsService.writeFile(undoPayload.filePath, undoPayload.previousContent);
        } else if (undoPayload.action === "delete_created") {
            await desktopWindowsService.deleteFileSafe(undoPayload.filePath);
        } else {
            throw new Error(`Unsupported undo action: ${undoPayload.action}`);
        }

        audit.undoStatus = "reverted";
        await audit.save();

        return { success: true, message: "Action successfully reverted." };
    }
};
