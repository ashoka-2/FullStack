import { Router } from "express";
import { validateRegisterUser, validateLoginUser } from "../validator/auth.validator.js";
import { googleCallback, login, register, getMe, logout, updateProfile, getAllUsers, getUserById, getUserDetail, toggleBanUser } from "../controllers/auth.controller.js";
import passport from "passport";
import { config } from "../config/config.js";
import { verifyToken, authenticateSeller, authenticateAdmin } from "../middlewares/auth.middleware.js";

import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/register", validateRegisterUser, register);

router.post("/login", validateLoginUser, login);

router.post("/logout", logout);

router.put("/update-profile", verifyToken as any, upload.single("profilePic"), updateProfile as any);

router.get("/me", verifyToken as any, getMe as any);

router.get("/users", verifyToken as any, authenticateSeller as any, getAllUsers as any);
router.get("/users/:id/detail", verifyToken as any, authenticateSeller as any, getUserDetail as any);
router.get("/users/:id", verifyToken as any, authenticateSeller as any, getUserById as any);
router.put("/users/:id/ban", verifyToken as any, authenticateAdmin as any, toggleBanUser as any);

// /api/auth/google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: config.NODE_ENV == "development" ? "http://localhost:5173/login" : "/login",
    }),
    googleCallback
);

export default router;