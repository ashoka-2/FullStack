/**
 * Mobile Companion Engine & Cross-Platform Capability Matrix
 * Supports Android (Accessibility Service + Platform Intents) and iOS (Shortcuts / App Intents)
 */

export const MOBILE_PLATFORM_CAPABILITIES = {
    android: {
        platformName: "Android (API 26+)",
        supportsBackgroundExecution: true,
        features: {
            launchApps: { supported: true, method: "PackageIntent / LauncherManager" },
            screenTapsAndScrolls: { supported: true, method: "Android AccessibilityService GestureDescription" },
            readScreenContent: { supported: true, method: "AccessibilityNodeInfo Inspection" },
            systemToggles: { 
                wifi: true, 
                bluetooth: true, 
                flashlight: true, 
                dnd: true, 
                volume: true, 
                brightness: true 
            },
            takeScreenshots: { supported: true, method: "MediaProjection API / AccessibilityService.takeScreenshot" },
            notifications: {
                send: true,
                readAndReply: { supported: true, permissionRequired: "NotificationListenerService" }
            },
            clipboardSync: { supported: true, method: "ClipboardManager" }
        },
        constraints: [
            "Requires user to grant 'Accessibility Service' and 'Notification Access' once during initial pairing.",
            "Battery optimization must be disabled (Whitelisted) for uninterrupted background socket connection."
        ]
    },
    ios: {
        platformName: "Apple iOS (15+)",
        supportsBackgroundExecution: false,
        features: {
            launchApps: { supported: true, method: "Custom URL Schemes / Shortcuts" },
            screenTapsAndScrolls: { supported: false, reason: "Strict iOS sandbox forbids inter-app touch injection without supervised MDM." },
            readScreenContent: { supported: false, reason: "Forbidden by Apple Privacy sandbox." },
            systemToggles: {
                wifi: false,
                bluetooth: false,
                flashlight: true,
                dnd: true, // via Shortcuts
                volume: false,
                brightness: false
            },
            takeScreenshots: { supported: false, reason: "No background screenshot API permitted for App Store third-party apps." },
            notifications: {
                send: true,
                readAndReply: false
            },
            clipboardSync: { supported: true, method: "UIPasteboard on active focus" }
        },
        constraints: [
            "iOS sandboxing limits background operations: automation relies on Apple Shortcuts & Siri App Intents.",
            "Live touch simulation and background screen reading are unavailable on non-jailbroken iOS devices."
        ]
    }
};

export const mobileCompanionService = {
    getPlatformCapabilities(platform) {
        const key = (platform || "").toLowerCase();
        return MOBILE_PLATFORM_CAPABILITIES[key] || MOBILE_PLATFORM_CAPABILITIES.android;
    },

    formatCommandPayload(device, action, params = {}) {
        const capabilities = this.getPlatformCapabilities(device.platform);
        
        // Verify platform feasibility before dispatch
        if (device.platform === "ios") {
            if (action === "screen_tap" || action === "screen_read" || action === "take_screenshot") {
                throw new Error(
                    `Action '${action}' is restricted on iOS due to Apple platform sandboxing. Use Android companion or desktop for interactive UI automation.`
                );
            }
        }

        return {
            commandId: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            targetDevice: device._id,
            platform: device.platform,
            action,
            params,
            timestamp: new Date().toISOString()
        };
    }
};
