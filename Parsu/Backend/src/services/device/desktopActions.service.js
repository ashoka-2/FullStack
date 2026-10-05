import { desktopWindowsService } from "./desktopWindows.service.js";

/**
 * Shared desktop action dispatcher.
 * Used by the orchestrator (backend running on the PC) and by the standalone
 * desktop companion (backend hosted remotely) so both behave identically.
 */
export async function runDesktopAction(action, params = {}) {
    let result = null;
    let canUndo = false;
    let undoPayload = null;

    switch (action) {
        case "list_processes":
            result = await desktopWindowsService.listProcesses(params.limit);
            break;
        case "launch_app":
            result = await desktopWindowsService.launchApp(params.appOrPath, params.args);
            if (result && result.launched === false) {
                throw new Error(result.error || `App '${params.appOrPath}' not found and could not open.`);
            }
            break;
        case "app_search":
            result = await desktopWindowsService.appSearch(params.app, params.query);
            break;
        case "system_shortcut":
            result = await desktopWindowsService.systemShortcut(params.shortcut);
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
        case "type_text":
            result = await desktopWindowsService.typeText(params.text, params.targetApp, params.pressEnter);
            break;
        case "whatsapp_message":
            result = await desktopWindowsService.whatsappSendMessage({
                contactOrPhone: params.contactOrPhone,
                message: params.message
            });
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
        case "set_volume": {
            // Voice agent sends { level } or { delta: ±N }
            let volTarget;
            if (params.delta !== undefined) {
                const cur = await desktopWindowsService.getCurrentVolume?.() ?? 50;
                volTarget = Math.max(0, Math.min(100, cur + params.delta));
            } else {
                volTarget = params.level ?? params.levelPercent ?? 50;
            }
            result = await desktopWindowsService.setVolume(volTarget);
            break;
        }
        case "set_brightness": {
            let briTarget;
            if (params.delta !== undefined) {
                const cur = await desktopWindowsService.getCurrentBrightness?.() ?? 70;
                briTarget = Math.max(0, Math.min(100, cur + params.delta));
            } else {
                briTarget = params.level ?? params.percent ?? 70;
            }
            result = await desktopWindowsService.setBrightness(briTarget);
            break;
        }
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

    return { result, canUndo, undoPayload };
}
