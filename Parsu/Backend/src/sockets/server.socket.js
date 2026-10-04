import { Server } from "socket.io";
import Device from "../models/device.model.js";
import crypto from "crypto";

let io;

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: [
                "https://parsuai.vercel.app",
                "https://perplexity-cohort.vercel.app",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://parsuai.onrender.com",
                "https://parsuai-1y3u.onrender.com",
                process.env.FRONTEND_URL
            ].filter(Boolean),
            credentials: true
        }
    });

    console.log("[Socket.IO] Server is Running with Zero-Token Account-Linked Device Protocol...");

    io.on("connection", (socket) => {
        let connectedDeviceId = null;
        let connectedUserId = null;

        // ─── User Room Subscription ────────────────────────────────────────────────
        socket.on("user:subscribe", (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
                connectedUserId = userId;
            }
        });

        // ─── Account-Linked Zero-Config Auto-Registration ─────────────────────────
        // Fires automatically when any app (web, desktop companion, mobile) starts
        // while the user is logged in. No token shown, no CLI command needed.
        socket.on("device:auto_register", async ({ userId, platform, deviceType, name, userAgent, systemMetrics }) => {
            try {
                if (!userId) return;
                connectedUserId = userId.toString();
                socket.join(`user:${connectedUserId}`);

                const effectivePlatform = platform || "windows";
                const effectiveType = deviceType || (["android", "ios"].includes(effectivePlatform) ? "mobile" : "desktop");
                const defaultName = name || (effectiveType === "mobile" ? "Mobile Phone" : "Personal Desktop");

                let device = await Device.findOne({
                    user: connectedUserId,
                    platform: effectivePlatform,
                    deviceType: effectiveType
                });

                if (device) {
                    device.status = "online";
                    device.lastSeen = new Date();
                    if (systemMetrics) device.systemMetrics = { ...device.systemMetrics, ...systemMetrics };
                    await device.save();
                } else {
                    // Generate internal-only device secret — never shown to user
                    const deviceSecret = crypto.randomBytes(32).toString("hex");
                    device = await Device.create({
                        user: connectedUserId,
                        name: defaultName,
                        deviceType: effectiveType,
                        platform: effectivePlatform,
                        deviceSecret,
                        status: "online",
                        systemInfo: { osVersion: userAgent || "", hostname: defaultName },
                        capabilities: [
                            "app_control", "input_simulation", "file_system", "clipboard",
                            "system_settings", "screen_capture", "notifications", "macros",
                            "browser_control", "device_sync"
                        ],
                        lastSeen: new Date()
                    });
                }

                connectedDeviceId = device._id.toString();
                socket.join(`device:${connectedDeviceId}`);

                // Safe serialisation — strip deviceSecret
                const safeDevice = device.toObject();
                delete safeDevice.deviceSecret;

                socket.emit("device:auto_registered", { success: true, device: safeDevice });

                // Notify all active devices under this user about the updated device list
                const allUserDevices = await Device.find({ user: connectedUserId }).lean();
                const safeList = allUserDevices.map(d => { delete d.deviceSecret; return d; });
                io.to(`user:${connectedUserId}`).emit("device:sync_list", safeList);

                console.log(`[Socket.IO] Auto-linked: ${device.name} (${device.platform}) for user ${connectedUserId}`);
            } catch (err) {
                console.error("[Socket.IO] device:auto_register error:", err.message);
            }
        });

        // ─── Device-to-Device Command Relay ───────────────────────────────────────
        // e.g. mobile → "open Chrome on my PC"; desktop → "read my phone's notifications"
        socket.on("device:relay_command", ({ targetDeviceId, action, params, senderDeviceName }) => {
            if (targetDeviceId && connectedUserId) {
                io.to(`device:${targetDeviceId}`).emit("device:incoming_relay", {
                    senderDeviceId: connectedDeviceId,
                    senderDeviceName: senderDeviceName || "Paired Device",
                    action,
                    params,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // ─── Relay Command Result Back to Originating Device ──────────────────────
        socket.on("device:relay_result", ({ senderDeviceId, auditId, success, result, error }) => {
            if (senderDeviceId && connectedUserId) {
                io.to(`device:${senderDeviceId}`).emit("device:relay_completed", {
                    auditId,
                    success,
                    result,
                    error,
                    executingDeviceId: connectedDeviceId
                });
            }
        });

        // ─── Device Heartbeat & Telemetry ─────────────────────────────────────────
        socket.on("device:heartbeat", async (data) => {
            try {
                if (!connectedDeviceId) return;
                const update = { status: "online", lastSeen: new Date() };
                if (data?.systemMetrics) update.systemMetrics = data.systemMetrics;

                const device = await Device.findByIdAndUpdate(connectedDeviceId, update, { returnDocument: 'after' });
                if (device && connectedUserId) {
                    io.to(`user:${connectedUserId}`).emit("device:telemetry", {
                        deviceId: connectedDeviceId,
                        systemMetrics: device.systemMetrics,
                        lastSeen: device.lastSeen
                    });
                }
            } catch (err) {
                console.error("[Socket.IO] device:heartbeat error:", err.message);
            }
        });

        // ─── Clipboard Sync ────────────────────────────────────────────────────────
        socket.on("device:clipboard_sync", async ({ text, mimeType = "text/plain" }) => {
            try {
                if (!connectedUserId || !text) return;
                io.to(`user:${connectedUserId}`).emit("device:clipboard_synced", {
                    text,
                    mimeType,
                    sourceDeviceId: connectedDeviceId,
                    timestamp: new Date().toISOString()
                });
            } catch (err) {
                console.error("[Socket.IO] device:clipboard_sync error:", err.message);
            }
        });

        // ─── Cross-Device Chat Sync (Task E) ──────────────────────────────────────
        // Messages sent on any device appear on all other devices in real time
        socket.on("chat:message_sent", ({ chatId, message }) => {
            if (connectedUserId) {
                socket.to(`user:${connectedUserId}`).emit("chat:message_synced", {
                    chatId,
                    message,
                    fromDeviceId: connectedDeviceId,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // ─── Orchestrator Action Response ──────────────────────────────────────────
        socket.on("device:action_response", ({ auditId, success, result, error }) => {
            if (connectedUserId) {
                io.to(`user:${connectedUserId}`).emit("device:action_finished", {
                    auditId,
                    success,
                    result,
                    error
                });
            }
        });

        // ─── Disconnect ────────────────────────────────────────────────────────────
        socket.on("disconnect", async () => {
            if (connectedDeviceId) {
                try {
                    await Device.findByIdAndUpdate(connectedDeviceId, {
                        status: "offline",
                        lastSeen: new Date()
                    });
                    if (connectedUserId) {
                        io.to(`user:${connectedUserId}`).emit("device:status_change", {
                            deviceId: connectedDeviceId,
                            status: "offline",
                            lastSeen: new Date()
                        });
                    }
                    console.log(`[Socket.IO] Device offline: ${connectedDeviceId}`);
                } catch (err) {
                    console.error("[Socket.IO] Disconnect update error:", err.message);
                }
            }
        });
    });
}

export function getIO() {
    if (!io) return null;
    return io;
}
