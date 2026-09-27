#!/usr/bin/env node
/**
 * Parsu Desktop Companion Service (Task 1)
 * 
 * Standalone companion agent running on the target desktop/laptop.
 * Connects securely to Parsu Orchestrator using pairing token,
 * streams system telemetry, and executes privileged OS automations.
 * 
 * Usage:
 *   node parsu-desktop-companion.js --token <PAIRING_TOKEN> [--server http://localhost:5000]
 */

import { io } from "socket.io-client";
import os from "os";
import { desktopWindowsService } from "../services/device/desktopWindows.service.js";

const args = process.argv.slice(2);
let token = process.env.PARSU_PAIRING_TOKEN || "";
let serverUrl = process.env.PARSU_SERVER_URL || "http://localhost:5000";

for (let i = 0; i < args.length; i++) {
    if (args[i] === "--token" && args[i + 1]) token = args[i + 1];
    if (args[i] === "--server" && args[i + 1]) serverUrl = args[i + 1];
}

if (!token) {
    console.error("❌ Error: Device pairing token required.");
    console.error("Usage: node parsu-desktop-companion.js --token <PAIRING_TOKEN> [--server http://localhost:5000]");
    process.exit(1);
}

console.log(`\n======================================================`);
console.log(`🚀 Parsu Desktop Companion Agent v1.0`);
console.log(`🖥️  Host: ${os.hostname()} (${os.platform()} ${os.arch()})`);
console.log(`🔗 Target Server: ${serverUrl}`);
console.log(`🔑 Pairing Token: ${token.substring(0, 8)}...`);
console.log(`======================================================\n`);

const socket = io(serverUrl, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 2000
});

socket.on("connect", () => {
    console.log(`✅ Connected to Parsu Orchestrator (Socket ID: ${socket.id})`);
    
    // Register device
    const systemInfo = {
        osVersion: `${os.type()} ${os.release()}`,
        hostname: os.hostname(),
        arch: os.arch(),
        monitors: 1
    };

    socket.emit("device:register", {
        pairingToken: token,
        systemInfo,
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
            "browser_control"
        ]
    });
});

socket.on("device:registered", (data) => {
    console.log(`✨ Successfully registered as device: "${data.name}" [${data.deviceId}]`);
    startTelemetryHeartbeat();
});

socket.on("device:error", (err) => {
    console.error(`❌ Registration Error:`, err.message);
});

// Execute action requested from the central orchestrator
socket.on("device:execute_action", async (payload) => {
    const { auditId, action, params } = payload;
    console.log(`\n⚡ Received Action Request: [${action}] (Audit: ${auditId})`);
    
    try {
        let result;
        switch (action) {
            case "launch_app":
                result = await desktopWindowsService.launchApp(params.appName);
                break;
            case "close_app":
                result = await desktopWindowsService.closeApp(params.processName);
                break;
            case "list_processes":
                result = await desktopWindowsService.listRunningProcesses(params.limit);
                break;
            case "window_control":
                result = await desktopWindowsService.controlWindow(params.windowTitle, params.windowAction);
                break;
            case "simulate_input":
                result = await desktopWindowsService.simulateInput(params.type, params.payload);
                break;
            case "file_operation":
                result = await desktopWindowsService.fileOperation(params.operation, params.fileParams);
                break;
            case "read_clipboard":
                result = await desktopWindowsService.readClipboard();
                break;
            case "write_clipboard":
                result = await desktopWindowsService.writeClipboard(params.text);
                break;
            case "system_settings":
                result = await desktopWindowsService.controlSystemSettings(params.setting, params.value);
                break;
            case "take_screenshot":
                result = await desktopWindowsService.takeScreenshot(params.region);
                break;
            case "send_notification":
                result = await desktopWindowsService.sendNotification(params.title, params.message);
                break;
            case "browser_open":
                result = await desktopWindowsService.openBrowserUrl(params.url);
                break;
            default:
                throw new Error(`Unsupported companion action: ${action}`);
        }

        console.log(`✅ Action [${action}] completed successfully.`);
        socket.emit("device:action_response", {
            auditId,
            success: true,
            result
        });
    } catch (err) {
        console.error(`❌ Action [${action}] failed:`, err.message);
        socket.emit("device:action_response", {
            auditId,
            success: false,
            error: err.message
        });
    }
});

let heartbeatTimer = null;
function startTelemetryHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    
    heartbeatTimer = setInterval(async () => {
        try {
            const stats = await desktopWindowsService.getSystemStats();
            socket.emit("device:heartbeat", {
                systemMetrics: {
                    cpuUsagePercent: stats.cpuUsagePercent || 0,
                    ramUsageMb: stats.ramUsageMb || Math.round((os.totalmem() - os.freemem()) / (1024 * 1024)),
                    batteryPercent: stats.batteryPercent || 100,
                    isCharging: stats.isCharging ?? true
                }
            });
        } catch (e) {
            // silent heartbeat err
        }
    }, 5000);
}

socket.on("disconnect", () => {
    console.log("⚠️ Disconnected from Parsu Orchestrator. Reconnecting...");
    if (heartbeatTimer) clearInterval(heartbeatTimer);
});
