import express, { Router } from "express";
import { authenticateAdmin } from "../middlewares/auth.middleware.js";
import { getSettings, updateSettings } from "../controllers/setting.controller.js";

const router: Router = express.Router();

router.get("/", getSettings as any);
router.put("/", authenticateAdmin as any, updateSettings as any);

export default router;
