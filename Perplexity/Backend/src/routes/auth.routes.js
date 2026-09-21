import { Router } from 'express';
import passport from "passport";
import { 
  registerUser, 
  loginUser, 
  verifyEmail, 
  logoutUser, 
  getMe, 
  updateProfile, 
  resendVerificationEmail, 
  googleCallback,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword
} from "../controllers/auth.controller.js";
import { loginValidator, registerValidator } from '../validators/auth.validator.js';
import { authUser } from "../middlewares/auth.middleware.js";
import { authLimiter, registerLimiter } from "../middlewares/rateLimiter.middleware.js";

const authRouter = Router();

authRouter.get("/verify-email", verifyEmail);
authRouter.post("/resend-verification-email", resendVerificationEmail);

authRouter.post('/register', registerLimiter, registerValidator, registerUser);
authRouter.post('/login', authLimiter, loginValidator, loginUser);
authRouter.post('/logout', logoutUser);
authRouter.get('/me', authUser, getMe);
authRouter.put('/profile', authUser, updateProfile);

// Password Management (OTP Flow & Change Password)
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/verify-otp', authLimiter, verifyOtp);
authRouter.post('/reset-password', authLimiter, resetPassword);
authRouter.post('/change-password', authUser, changePassword);

// Google OAuth (Passport Strategy with proxy: true matching Scapegoat)
authRouter.get("/google", passport.authenticate("google", { 
  scope: ["profile", "email"],
  prompt: "select_account" 
}));

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL || 'https://perplexity-cohort.vercel.app'}/auth?error=auth_failed`,
    session: false
  }),
  googleCallback
);

export default authRouter;