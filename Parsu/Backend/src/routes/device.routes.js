import { Router } from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
    autoRegisterDevice,
    getDevices,
    getDeviceById,
    renameDevice,
    setDefaultDevice,
    unpairDevice,
    executeDeviceCommand,
    confirmAction,
    undoAction,
    getAuditLogs,
    getMacros,
    createMacro,
    runMacro,
    syncClipboard,
    deviceHeartbeat
} from "../controllers/device.controller.js";

const router = Router();

// All device routes require authentication
router.use(authUser);

// ─── Device Registry (auto-linking only, no manual pairing) ─────────────────
router.get("/", getDevices);
router.post("/auto-register", autoRegisterDevice);
// REST heartbeat — used by SW background sync when no socket is available
router.post("/heartbeat", deviceHeartbeat);

// ─── Audit & Macros ──────────────────────────────────────────────────────────
router.get("/audit/logs", getAuditLogs);
router.get("/macros", getMacros);
router.post("/macros", createMacro);
router.post("/macros/:macroId/run", runMacro);

// ─── Clipboard ───────────────────────────────────────────────────────────────
router.post("/clipboard/sync", syncClipboard);

// ─── Command Execution & Confirmation Lifecycle ──────────────────────────────
router.post("/execute", executeDeviceCommand);
router.post("/confirm/:auditId", confirmAction);
router.post("/undo/:auditId", undoAction);

// ─── Per-Device Management (rename, set-default, unlink) ────────────────────
router.get("/:deviceId", getDeviceById);
router.patch("/:deviceId/rename", renameDevice);
router.patch("/:deviceId/default", setDefaultDevice);
router.delete("/:deviceId", unpairDevice);

export default router;
