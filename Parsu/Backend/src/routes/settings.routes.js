import { Router } from 'express';
import { authUser, requireAdmin } from '../middlewares/auth.middleware.js';
import {
    getUserSettings,
    updateUserSettings,
    clearMemory,
    addMemoryFact,
    deleteMemoryFact,
    getUserMedia,
    deleteUserMedia,
    submitBugReport,
    getUserBugReports,
    getAdminBugReports,
    updateBugReportStatus,
    deleteAdminBugReport
} from '../controllers/settings.controller.js';

const settingsRouter = Router();

// ── User Settings (memory + preferences) ───────────────────────────────────
settingsRouter.get('/', authUser, getUserSettings);
settingsRouter.put('/', authUser, updateUserSettings);
settingsRouter.delete('/memory', authUser, clearMemory);
settingsRouter.post('/memory/fact', authUser, addMemoryFact);
settingsRouter.delete('/memory/fact/:index', authUser, deleteMemoryFact);

// ── Media Management ────────────────────────────────────────────────────────
settingsRouter.get('/media', authUser, getUserMedia);
settingsRouter.delete('/media/:fileId', authUser, deleteUserMedia);

// ── Bug Reports (user) ──────────────────────────────────────────────────────
settingsRouter.post('/bug-report', authUser, submitBugReport);
settingsRouter.get('/bug-reports', authUser, getUserBugReports);

// ── Bug Reports (admin fallback) ─────────────────────────────────────────────
settingsRouter.get('/admin/bug-reports', authUser, requireAdmin, getAdminBugReports);
settingsRouter.put('/admin/bug-reports/:id', authUser, requireAdmin, updateBugReportStatus);
settingsRouter.delete('/admin/bug-reports/:id', authUser, requireAdmin, deleteAdminBugReport);

export default settingsRouter;
