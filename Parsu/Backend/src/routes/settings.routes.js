import { Router } from 'express';
import { authUser, requireAdmin } from '../middlewares/auth.middleware.js';
import {
    getUserSettings,
    updateUserSettings,
    clearMemory,
    getUserMedia,
    deleteUserMedia,
    submitBugReport,
    getAdminBugReports,
    updateBugReportStatus
} from '../controllers/settings.controller.js';

const settingsRouter = Router();

// ── User Settings (memory + preferences) ───────────────────────────────────
settingsRouter.get('/', authUser, getUserSettings);
settingsRouter.put('/', authUser, updateUserSettings);
settingsRouter.delete('/memory', authUser, clearMemory);

// ── Media Management ────────────────────────────────────────────────────────
settingsRouter.get('/media', authUser, getUserMedia);
settingsRouter.delete('/media/:fileId', authUser, deleteUserMedia);

// ── Bug Reports (user) ──────────────────────────────────────────────────────
settingsRouter.post('/bug-report', authUser, submitBugReport);

// ── Bug Reports (admin) ─────────────────────────────────────────────────────
settingsRouter.get('/admin/bug-reports', authUser, requireAdmin, getAdminBugReports);
settingsRouter.put('/admin/bug-reports/:id', authUser, requireAdmin, updateBugReportStatus);

export default settingsRouter;
