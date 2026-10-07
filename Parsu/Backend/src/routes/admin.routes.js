import { Router } from "express";
import { authUser, requireAdmin } from "../middlewares/auth.middleware.js";
import {
    getAdminOverview,
    getAdminUsers,
    updateUserRole,
    updateUserSubscription,
    deleteUser,
    toggleUserBlock,
    claimInitialAdmin,
    getAdminContacts,
    updateContactStatus,
    deleteContact,
    getAdminNewsletter,
    deleteNewsletterSubscriber,
    getAdminApiUsage,
    getAdminSocialConnections,
    disconnectAdminSocialConnection,
    getAdminMediaAssets,
    deleteAdminMediaAsset,
    testAdminAiPrompt,
    getAdminPlatformSettings,
    updateAdminPlatformSettings,
    getAdminConnectors,
    toggleAdminConnectorLock,
    updateAdminConnector
} from "../controllers/admin.controller.js";
import {
    getAdminBugReports,
    updateBugReportStatus,
    deleteAdminBugReport
} from "../controllers/settings.controller.js";

const adminRouter = Router();

// Endpoint for the first user to bootstrap admin access
adminRouter.post("/claim-initial-admin", authUser, claimInitialAdmin);

// Protected Admin-only endpoints
adminRouter.use(authUser, requireAdmin);

adminRouter.get("/overview", getAdminOverview);
adminRouter.get("/users", getAdminUsers);
adminRouter.patch("/users/:id/role", updateUserRole);
adminRouter.patch("/users/:id/subscription", updateUserSubscription);
adminRouter.patch("/users/:id/block", toggleUserBlock);
adminRouter.delete("/users/:id", deleteUser);

// Contact messages inbox
adminRouter.get("/contacts", getAdminContacts);
adminRouter.patch("/contacts/:id", updateContactStatus);
adminRouter.delete("/contacts/:id", deleteContact);

// Newsletter subscribers
adminRouter.get("/newsletter", getAdminNewsletter);
adminRouter.delete("/newsletter/:id", deleteNewsletterSubscriber);

// Live API Usage and Quota monitor
adminRouter.get("/api-usage", getAdminApiUsage);

// Social connections across all users
adminRouter.get("/social-connections", getAdminSocialConnections);
adminRouter.delete("/social-connections/:id", disconnectAdminSocialConnection);

// App Connectors & Social Integrations locking governance
adminRouter.get("/connectors", getAdminConnectors);
adminRouter.patch("/connectors/:appId/toggle", toggleAdminConnectorLock);
adminRouter.put("/connectors/:appId", updateAdminConnector);

// User-uploaded & generated media assets vault (for review and moderation)
adminRouter.get("/media-assets", getAdminMediaAssets);
adminRouter.delete("/media-assets/:messageId", deleteAdminMediaAsset);

// Admin AI Playground and sandbox test
adminRouter.post("/ai-test", testAdminAiPrompt);

// Global platform settings
adminRouter.get("/settings", getAdminPlatformSettings);
adminRouter.patch("/settings", updateAdminPlatformSettings);

// Bug Reports management & moderation
adminRouter.get("/bug-reports", getAdminBugReports);
adminRouter.patch("/bug-reports/:id", updateBugReportStatus);
adminRouter.put("/bug-reports/:id", updateBugReportStatus);
adminRouter.delete("/bug-reports/:id", deleteAdminBugReport);

export default adminRouter;
