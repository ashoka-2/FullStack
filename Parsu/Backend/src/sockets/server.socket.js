import { Server } from "socket.io";
import Device from "../models/device.model.js";

let io;

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: [
                "https://parsuai.vercel.app",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                process.env.FRONTEND_URL
            ].filter(Boolean),
            credentials: true
        }
    });

    console.log("[Socket.IO] Server is Running with Cross-Device Protocol...");

    io.on("connection", (socket) => {
        let connectedDeviceId = null;
        let connectedUserId = null;

        // User client room subscription
        socket.on("user:subscribe", (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
                connectedUserId = userId;
            }
        });

        // Account-Linked Zero-Config Auto-Registration (same email/account across Mobile & Desktop)
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
                    const pairingToken = `psu_dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                    device = await Device.create({
                        user: connectedUserId,
                        name: defaultName,
                        deviceType: effectiveType,
                        platform: effectivePlatform,
                        pairingToken,
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

                socket.emit("device:auto_registered", {
                    success: true,
                    device
                });

                // Notify all active devices under this user about the updated device list
                const allUserDevices = await Device.find({ user: connectedUserId }).lean();
                io.to(`user:${connectedUserId}`).emit("device:sync_list", allUserDevices);
                console.log(`[Socket.IO] Account-sync active: ${device.name} (${device.platform}) for user ${connectedUserId}`);
            } catch (err) {
                console.error("[Socket.IO] device:auto_register error:", err.message);
            }
        });

        // Direct device-to-device command relay (e.g. mobile controlling desktop or vice versa)
        socket.on("device:relay_command", ({ targetDeviceId, action, params, senderDeviceName }) => {
            if (targetDeviceId && connectedUserId) {
                io.to(`device:${targetDeviceId}`).emit("device:incoming_relay", {
                    senderDeviceId: connectedDeviceId,
                    senderDeviceName: senderDeviceName || "Paired Companion",
                    action,
                    params,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Companion device registration via pairingToken
        socket.on("device:register", async ({ pairingToken, systemInfo, capabilities }) => {
            try {
                if (!pairingToken) return socket.emit("device:error", { message: "Missing pairing token" });

                const device = await Device.findOne({ pairingToken });
                if (!device) {
                    return socket.emit("device:error", { message: "Invalid pairing token" });
                }

                connectedDeviceId = device._id.toString();
                connectedUserId = device.user.toString();

                device.status = "online";
                device.lastSeen = new Date();
                if (systemInfo) device.systemInfo = { ...device.systemInfo, ...systemInfo };
                if (capabilities && Array.isArray(capabilities)) device.capabilities = capabilities;
                await device.save();

                socket.join(`user:${connectedUserId}`);
                socket.join(`device:${connectedDeviceId}`);

                socket.emit("device:registered", {
                    success: true,
                    deviceId: connectedDeviceId,
                    name: device.name,
                    platform: device.platform
                });

                // Notify frontend user clients about device status change
                io.to(`user:${connectedUserId}`).emit("device:status_change", {
                    deviceId: connectedDeviceId,
                    status: "online",
                    lastSeen: device.lastSeen,
                    systemMetrics: device.systemMetrics
                });

                console.log(`[Socket.IO] Device paired and online: ${device.name} (${device.platform})`);
            } catch (err) {
                console.error("[Socket.IO] device:register error:", err.message);
                socket.emit("device:error", { message: err.message });
            }
        });

        // Device Heartbeat & Telemetry update
        socket.on("device:heartbeat", async (data) => {
            try {
                if (!connectedDeviceId) return;
                const update = {
                    status: "online",
                    lastSeen: new Date()
                };
                if (data?.systemMetrics) {
                    update.systemMetrics = data.systemMetrics;
                }
                const device = await Device.findByIdAndUpdate(connectedDeviceId, update, { new: true });
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

        // Clipboard sync from device/client to all active user nodes
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

        // Forward remote device execution response back to orchestrator
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

        // Handle disconnect
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
                    console.log(`[Socket.IO] Device disconnected: ${connectedDeviceId}`);
                } catch (err) {
                    console.error("[Socket.IO] Disconnect update error:", err.message);
                }
            }
        });
    });
}

export function getIO() {
    if (!io) {
        return null;
    }
    return io;
}
