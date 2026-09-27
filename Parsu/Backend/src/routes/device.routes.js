import { Router } from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
    pairDevice,
    autoRegisterDevice,
    getDevices,
    getDeviceById,
    unpairDevice,
    executeDeviceCommand,
    confirmAction,
    undoAction,
    getAuditLogs,
    getMacros,
    createMacro,
    runMacro,
    syncClipboard
} from "../controllers/device.controller.js";

const router = Router();

// All device routes require authentication
router.use(authUser);

// Device Registry & Pairing
router.get("/", getDevices);
router.post("/auto-register", autoRegisterDevice);
router.post("/pair", pairDevice);
router.get("/audit/logs", getAuditLogs);
router.get("/macros", getMacros);
router.post("/macros", createMacro);
router.post("/macros/:macroId/run", runMacro);
router.post("/clipboard/sync", syncClipboard);

// Command Execution & Confirmation Lifecycle
router.post("/execute", executeDeviceCommand);
router.post("/confirm/:auditId", confirmAction);
router.post("/undo/:auditId", undoAction);

// Specific Device Management
router.get("/:deviceId", getDeviceById);
router.delete("/:deviceId", unpairDevice);

export default router;
