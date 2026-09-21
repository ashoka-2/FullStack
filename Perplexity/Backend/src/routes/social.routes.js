import { Router } from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
    getConnectedAccounts,
    startOAuthFlow,
    handleOAuthCallback,
    disconnectAccount,
    connectManual,
    publishContent,
    generateCaption
} from "../controllers/social.controller.js";

const socialRouter = Router();

// All routes except callbacks require auth
socialRouter.get("/accounts", authUser, getConnectedAccounts);
socialRouter.delete("/accounts/:platform", authUser, disconnectAccount);
socialRouter.get("/connect/:platform", authUser, startOAuthFlow);
socialRouter.post("/connect-manual", authUser, connectManual);
socialRouter.post("/publish", authUser, publishContent);
socialRouter.post("/generate-caption", authUser, generateCaption);

// OAuth callbacks (no auth middleware — user returns from external platform)
socialRouter.get("/callback/:platform", handleOAuthCallback);

export default socialRouter;
