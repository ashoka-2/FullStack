import { Router } from "express";
import multer from "multer";
import { authUser } from "../middlewares/auth.middleware.js";
import {
    getConnectedAccounts,
    startOAuthFlow,
    handleOAuthCallback,
    disconnectAccount,
    connectManual,
    publishContent,
    generateCaption,
    uploadSocialMedia
} from "../controllers/social.controller.js";

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for high-res video
});

const socialRouter = Router();

// All routes except callbacks require auth
socialRouter.get("/accounts", authUser, getConnectedAccounts);
socialRouter.delete("/accounts/:platform", authUser, disconnectAccount);
socialRouter.get("/connect/:platform", authUser, startOAuthFlow);
socialRouter.post("/connect-manual", authUser, connectManual);
socialRouter.post("/publish", authUser, publishContent);
socialRouter.post("/generate-caption", authUser, generateCaption);
socialRouter.post("/upload-media", authUser, upload.array("files", 10), uploadSocialMedia);

// OAuth callbacks (no auth middleware — user returns from external platform)
socialRouter.get("/callback/:platform", handleOAuthCallback);

export default socialRouter;
