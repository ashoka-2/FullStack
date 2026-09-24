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
    getAdminApiUsage
} from "../controllers/admin.controller.js";

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

export default adminRouter;
