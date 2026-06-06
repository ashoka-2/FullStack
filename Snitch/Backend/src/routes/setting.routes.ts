import express, { Router } from "express";
import { authenticateAdmin } from "../middlewares/auth.middleware.js";
import {
    getSettings,
    updateSettings,
    updateAboutSettings,
    updateContactSettings,
    updateFooterSettings,
    updateLegalSettings,
    updatePrivacyPolicy,
    updateReturnPolicy,
    updateTermsOfService
} from "../controllers/setting.controller.js";

const router: Router = express.Router();

router.get("/", getSettings as any);
router.put("/", authenticateAdmin as any, updateSettings as any);

router.put("/about", authenticateAdmin as any, updateAboutSettings as any);
router.put("/contact", authenticateAdmin as any, updateContactSettings as any);
router.put("/footer", authenticateAdmin as any, updateFooterSettings as any);
router.put("/legal", authenticateAdmin as any, updateLegalSettings as any);
router.put("/legal/privacy", authenticateAdmin as any, updatePrivacyPolicy as any);
router.put("/legal/returns", authenticateAdmin as any, updateReturnPolicy as any);
router.put("/legal/terms", authenticateAdmin as any, updateTermsOfService as any);

export default router;

