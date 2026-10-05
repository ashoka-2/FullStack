#!/usr/bin/env node
/**
 * Parsu Desktop Companion Service
 *
 * Standalone background agent running on the target desktop/laptop.
 * Connects to the Parsu Orchestrator using the user's existing JWT session —
 * NO pairing token to copy, NO CLI flags to paste. Just open the app while
 * logged in and this device appears automatically in Settings → Devices.
 *
 * Usage:
 *   PARSU_JWT=<your_jwt_token> node parsu-desktop-companion.js [--server http://localhost:5000]
 *
 * The JWT is obtained automatically by the desktop app from the logged-in session.
 * It is never printed to the console.
 */

import { io } from "socket.io-client";
import os from "os";
import fetch from "node-fetch";
import { desktopWindowsService } from "../services/device/desktopWindows.service.js";
import { runDesktopAction } from "../services/device/desktopActions.service.js";

// ─── Configuration ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const serverUrl = (() => {
    const idx = args.indexOf("--server");
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : (process.env.PARSU_SERVER_URL || "http://localhost:5000");
})();

const JWT = process.env.PARSU_JWT || "";

if (!JWT) {
    console.error("❌ Parsu Desktop Companion: No JWT session found.");
    console.error("   Please log into the Parsu web/desktop app first. The companion will");
    console.error("   automatically pick up your session — no token to copy.");
    process.exit(1);
}

// ─── Detect platform ────────────────────────────────────────────────────────────
const platform = process.platform === "darwin" ? "macos" : process.platform === "linux" ? "linux" : "windows";
const deviceName = `${os.hostname()} (${platform === "macos" ? "Mac" : platform === "linux" ? "Linux" : "Windows"})`;

console.log(`\n📡 Parsu Desktop Companion Agent`);
console.log(`🖥️  Host: ${os.hostname()} · ${os.type()} ${os.release()}`);
console.log(`🔗 Server: ${serverUrl}\n`);

// ─── Step 1: Auto-register this device via REST (uses JWT, no token shown) ──────
let registeredDevice = null;

async function autoRegister() {
    try {
        const res = await fetch(`${serverUrl}/api/devices/auto-register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${JWT}`
            },
            body: JSON.stringify({
                name: deviceName,
                deviceType: "desktop",
                platform,
                userAgent: `NodeJS/${process.version} ${os.type()}/${os.release()}`
            })
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Registration failed");
        registeredDevice = data.device;
        console.log(`✅ Auto-linked as: "${registeredDevice.name}" [${registeredDevice._id}]`);
    } catch (err) {
        console.error("❌ Auto-registration failed:", err.message);
        console.error("   Make sure you are logged in and the server is reachable.");
        process.exit(1);
    }
}

// ─── Step 2: Open persistent WebSocket connection ────────────────────────────────
async function connectSocket() {
    await autoRegister();

    const socket = io(serverUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 2000,
        auth: { token: JWT }   // JWT passed in socket handshake auth, not visible
    });

    socket.on("connect", () => {
        console.log(`🔌 Connected to Parsu relay (${socket.id})`);

        // Announce this device to the account channel using account-based auto-register
        socket.emit("device:auto_register", {
            userId: registeredDevice?.user,
            platform,
            deviceType: "desktop",
            name: deviceName,
            userAgent: `NodeJS/${process.version} ${os.type()}/${os.release()}`
        });

        // Join the verified companion channel so the orchestrator can reach this PC
        // from any device logged in with the same account (phone, tablet, other browser).
        socket.emit("companion:register", { token: JWT }, (ack) => {
            if (ack?.ok) console.log("🛰️  Companion channel ready — remote control enabled");
            else console.error("❌ Companion registration rejected:", ack?.error);
        });

        startHeartbeat(socket);
    });

    // Actions forwarded by the Parsu backend (e.g. typed on phone → runs on this PC)
    socket.on("companion:execute", async ({ commandId, action, params }) => {
        console.log(`\n⚡ Remote command: [${action}]`);
        try {
            const { result } = await runDesktopAction(action, params || {});
            socket.emit("companion:result", { commandId, success: true, result });
            console.log(`✅ [${action}] completed`);
        } catch (err) {
            console.error(`❌ [${action}] failed:`, err.message);
            socket.emit("companion:result", { commandId, success: false, error: err.message });
        }
    });

    socket.on("device:auto_registered", ({ success, device }) => {
        if (success) {
            console.log(`✨ Device sync confirmed: "${device.name}" is live`);
        }
    });

    // ─── Execute cross-device actions sent from other devices / AI chat ─────────
    socket.on("device:incoming_relay", async ({ senderDeviceId, senderDeviceName, action, params }) => {
        console.log(`\n⚡ Relay command from "${senderDeviceName}": [${action}]`);
        let result;
        try {
            ({ result } = await runDesktopAction(action, params || {}));

            console.log(`✅ [${action}] completed`);
            socket.emit("device:relay_result", {
                senderDeviceId,
                success: true,
                result
            });
        } catch (err) {
            console.error(`❌ [${action}] failed:`, err.message);
            socket.emit("device:relay_result", {
                senderDeviceId,
                success: false,
                error: err.message
            });
        }
    });

    // Legacy orchestrator-dispatched action (backward compat)
    socket.on("device:execute_action", async ({ auditId, action, params }) => {
        console.log(`\n⚡ Orchestrator action: [${action}] (Audit: ${auditId})`);
        try {
            let result;
            switch (action) {
                case "launch_app": result = await desktopWindowsService.launchApp(params.appName); break;
                case "close_app": result = await desktopWindowsService.closeApp(params.processName); break;
                case "take_screenshot": result = await desktopWindowsService.takeScreenshot(params.region); break;
                case "browser_open": result = await desktopWindowsService.openBrowserUrl(params.url); break;
                default: throw new Error(`Unsupported action: ${action}`);
            }
            socket.emit("device:action_response", { auditId, success: true, result });
        } catch (err) {
            socket.emit("device:action_response", { auditId, success: false, error: err.message });
        }
    });

    socket.on("disconnect", () => {
        console.log("⚠️  Disconnected. Reconnecting automatically...");
        stopHeartbeat();
    });

    socket.on("connect_error", (err) => {
        console.error("❌ Connection error:", err.message);
    });

    return socket;
}

// ─── Telemetry Heartbeat ──────────────────────────────────────────────────────────
let heartbeatTimer = null;
function startHeartbeat(socket) {
    stopHeartbeat();
    heartbeatTimer = setInterval(async () => {
        try {
            const stats = await desktopWindowsService.getSystemMetrics();
            socket.emit("device:heartbeat", {
                systemMetrics: {
                    cpuUsagePercent: stats.cpuUsagePercent || 0,
                    ramUsageMb: stats.ramUsageMb || Math.round((os.totalmem() - os.freemem()) / (1024 * 1024)),
                    batteryPercent: stats.batteryPercent || 100,
                    isCharging: stats.isCharging ?? true
                }
            });
        } catch {
            // silent heartbeat error — reconnect handles it
        }
    }, 10000);
}

function stopHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
}

// ─── Boot ──────────────────────────────────────────────────────────────────────
connectSocket().catch(err => {
    console.error("Fatal error:", err.message);
    process.exit(1);
});
