import express, { Router } from "express";
import { authenticateAdmin } from "../middlewares/auth.middleware.js";
import { createMessage, getMessages, markAsRead, deleteMessage } from "../controllers/message.controller.js";

const router: Router = express.Router();

// Public: submit contact form or newsletter
router.post("/", createMessage as any);

// Admin only
router.get("/", authenticateAdmin as any, getMessages as any);
router.put("/:id/read", authenticateAdmin as any, markAsRead as any);
router.delete("/:id", authenticateAdmin as any, deleteMessage as any);

export default router;
