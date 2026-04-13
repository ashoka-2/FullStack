import { Router } from "express";
import { validateRegisterUser, validateLoginUser } from "../validator/auth.validator.js";
import { googleCallback, login, register, getMe, logout, updateProfile } from "../controllers/auth.controller.js";
import passport from "passport";
import { config } from "../config/config.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/register", validateRegisterUser, register);

router.post("/login", validateLoginUser, login);

router.post("/logout", logout);

router.put("/update-profile", verifyToken, upload.single("profilePic"), updateProfile);

router.get("/me", verifyToken, getMe);

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