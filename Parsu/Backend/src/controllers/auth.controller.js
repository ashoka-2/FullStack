import userModel from "../models/user.model.js";
import chatModel from "../models/chat.model.js";
import SocialConnection from "../models/social.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";
import redisClient, { isRedisReady } from "../config/redis.js";

export async function registerUser(req, res) {
  try {
    const { username, email, password } = req.body;

    const userExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with the same username or email already exists",
        err: "user already exists",
      });
    }

    const user = await userModel.create({
      username,
      email,
      password,
    });

    const emailVerificationToken = jwt.sign(
      {
        email: user.email,
      },
      process.env.JWT_SECRET,
    );

    const emailResult = await sendEmail({
      to: email,
      subject: "Welcome to Parsu - Please verify your email",
      html: `
        <div style="background-color: #000000; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100%;">
          <div style="background-color: #0a0a0a; max-width: 500px; margin: 0 auto; border-radius: 24px; border: 1px solid #2d2e2e; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
            <div style="padding: 48px; text-align: center;">
              <div style="width: 56px; height: 56px; background-color: #1a1a1a; border-radius: 16px; margin: 0 auto 32px; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
                 <table width="100%" height="100%"><tr><td align="center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#20b8cd"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11.0026 16L6.75997 11.7574L8.17418 10.3431L11.0026 13.1716L16.6595 7.51472L18.0737 8.92893L11.0026 16Z"></path></svg>
                 </td></tr></table>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 16px; letter-spacing: -0.025em;">Verify your email</h1>
              <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
                Welcome to <strong style="color: #fff;">Parsu</strong>, ${username}. We're excited to have you join our community of curious minds. Please click below to verify your account.
              </p>
              <a href="${(process.env.BACKEND_URL || 'https://parsuai.onrender.com').replace(/\/+$/, '')}/api/auth/verify-email?token=${emailVerificationToken}" 
                 style="display: inline-block; background-color: #20b8cd; color: #000; padding: 16px 40px; border-radius: 14px; font-size: 16px; font-weight: 700; text-decoration: none; transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 20px rgba(32, 184, 205, 0.15);">
                Verify Email Address
              </a>
              <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #1f1f1f;">
                <p style="color: #52525b; font-size: 13px; line-height: 20px; margin: 0;">
                  If you didn't create an account, you can safely ignore this email.
                </p>
                <p style="color: #20b8cd; font-size: 13px; font-weight: 600; margin-top: 12px;">
                  The Parsu Team
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    if (emailResult.error) {
      console.error("Failed to send welcome email:", emailResult.message);
    }

    res.status(200).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
      error: err.message
    });
  }
}


export async function resendVerificationEmail(req, res) {
  try {
    const { email } = req.body; 

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: "User email is already verified. Please log in.",
      });
    }

    const emailVerificationToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const emailResult = await sendEmail({
      to: email,
      subject: "Verify your Parsu email",
      html: `
        <div style="background-color: #000000; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100%;">
          <div style="background-color: #0a0a0a; max-width: 500px; margin: 0 auto; border-radius: 24px; border: 1px solid #2d2e2e; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
            <div style="padding: 48px; text-align: center;">
              <div style="width: 56px; height: 56px; background-color: #1a1a1a; border-radius: 16px; margin: 0 auto 32px; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
                 <table width="100%" height="100%"><tr><td align="center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#20b8cd"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11.0026 16L6.75997 11.7574L8.17418 10.3431L11.0026 13.1716L16.6595 7.51472L18.0737 8.92893L11.0026 16Z"></path></svg>
                 </td></tr></table>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 16px; letter-spacing: -0.025em;">New verification link</h1>
              <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
                Hi ${user.username}, you requested a new verification link for your Parsu account. This link will expire in 1 hour.
              </p>
              <a href="${(process.env.BACKEND_URL || 'https://parsuai.onrender.com').replace(/\/+$/, '')}/api/auth/verify-email?token=${emailVerificationToken}" 
                 style="display: inline-block; background-color: #20b8cd; color: #000; padding: 16px 40px; border-radius: 14px; font-size: 16px; font-weight: 700; text-decoration: none; box-shadow: 0 10px 20px rgba(32, 184, 205, 0.15);">
                Verify Email Address
              </a>
              <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #1f1f1f;">
                <p style="color: #52525b; font-size: 13px; line-height: 20px; margin: 0;">
                  The link is valid for 60 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    if (emailResult.error) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
        error: emailResult.message
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (err) {
    console.error("Resend Email Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
      error: err.message
    });
  }
}


export async function verifyEmail(req, res) {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


  const user = await userModel.findOne({ email: decoded.email });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid token",
      err: "user not found",
    });
  }

  const frontendUrl = (process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? "https://parsuai.vercel.app" : "http://localhost:5173")).replace(/\/+$/, "");

  if (user.verified) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Success | Parsu</title>
          <style>
              body { background: #0a0a0a; color: #f4f4f5; font-family: 'Inter', -apple-system, sans-serif; height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
              .container { text-align: center; background: #191a1a; padding: 4rem; border-radius: 3rem; border: 1px solid #2d2e2e; width: 480px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); position: relative; }
              .glow { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(32,184,205,0.05) 0%, rgba(0,0,0,0) 50%); pointer-events: none; z-index: -1; }
              h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1.5rem; letter-spacing: -0.05em; }
              p { color: #a1a1aa; line-height: 1.6; margin-bottom: 2.5rem; font-size: 1.1rem; }
              .btn { background: #20b8cd; color: #0a0a0a; text-decoration: none; padding: 1.25rem 2.5rem; border-radius: 1rem; font-weight: 700; font-size: 1.1rem; display: inline-block; transition: all 0.3s ease; box-shadow: 0 10px 20px rgba(32, 184, 205, 0.15); }
              .btn:hover { background: #1da9bc; transform: translateY(-2px); box-shadow: 0 15px 30px rgba(32, 184, 205, 0.2); }
              .icon { width: 80px; height: 80px; background: rgba(32, 184, 205, 0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 2.5rem; color: #20b8cd; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="glow"></div>
              <div class="icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h1>Already verified!</h1>
              <p>Hi ${user.username}, your account is already set up and ready to go. You don't need to do anything else.</p>
              <a href="${frontendUrl}/auth" class="btn">Log In Here</a>
          </div>
      </body>
      </html>
    `);
  }

  user.verified = true;
  await user.save();

  return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Success | Parsu</title>
          <style>
              body { background: #0a0a0a; color: #f4f4f5; font-family: 'Inter', -apple-system, sans-serif; height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
              .container { text-align: center; background: #191a1a; padding: 4rem; border-radius: 3rem; border: 1px solid #2d2e2e; width: 480px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); position: relative; }
              .glow { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(32,184,205,0.05) 0%, rgba(0,0,0,0) 50%); pointer-events: none; z-index: -1; }
              h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1.5rem; letter-spacing: -0.05em; }
              p { color: #a1a1aa; line-height: 1.6; margin-bottom: 2.5rem; font-size: 1.1rem; }
              .btn { background: #20b8cd; color: #0a0a0a; text-decoration: none; padding: 1.25rem 2.5rem; border-radius: 1rem; font-weight: 700; font-size: 1.1rem; display: inline-block; transition: all 0.3s ease; box-shadow: 0 10px 20px rgba(32, 184, 205, 0.15); }
              .btn:hover { background: #1da9bc; transform: translateY(-2px); box-shadow: 0 15px 30px rgba(32, 184, 205, 0.2); }
              .icon { width: 80px; height: 80px; background: rgba(32, 184, 205, 0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 2.5rem; color: #20b8cd; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="glow"></div>
              <div class="icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h1>You're verified!</h1>
              <p>Welcome aboard, ${user.username}. Your email has been successfully verified. You can now explore everything Parsu has to offer.</p>
              <a href="${frontendUrl}/auth" class="btn">Start Discovering</a>
          </div>
      </body>
      </html>
    `);

    } catch (err) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <style>
              body { background: #0a0a0a; color: #f4f4f5; font-family: 'Inter', -apple-system, sans-serif; height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; }
              .container { text-align: center; background: #191a1a; padding: 4rem; border-radius: 3rem; border: 1px solid #2d2e2e; width: 480px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
              h1 { font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem; color: #ef4444; }
              p { color: #a1a1aa; margin-bottom: 2.5rem; }
              .btn { background: #27272a; color: white; text-decoration: none; padding: 1rem 2rem; border-radius: 0.75rem; font-weight: 600; display: inline-block; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Verification Failed</h1>
              <p>The link is invalid or has expired. Please request a new verification link from the registration page.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/register" class="btn">Back to Register</a>
          </div>
      </body>
      </html>
    `);
  }
}

export async function loginUser(req, res) {
  const { username, email, password } = req.body;

  const cleanEmail = email ? email.trim().toLowerCase() : undefined;
  const cleanUsername = username ? username.trim() : undefined;

  const user = await userModel
    .findOne({
      $or: [
        ...(cleanUsername ? [{ username: cleanUsername }] : []),
        ...(cleanEmail ? [{ email: cleanEmail }, { alternateEmails: cleanEmail }] : []),
      ],
    })
    .select("+password");

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid credentials",
      err: "user not found",
    });
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return res.status(400).json({
      success: false,
      message: "Invalid credentials",
      err: "incorrect password",
    });
  }

  if (user.isBlocked) {
    return res.status(403).json({
      success: false,
      message: "Your account has been suspended by an administrator. Please contact support.",
      err: "account_blocked",
    });
  }

  if (!user.verified) {
    return res.status(400).json({
      message: "Please verify your email to login",
      success: false,
      err: "email not verified",
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,   // Mandatory for HTTPS
    sameSite: 'none', // Mandatory for cross-domain
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    token,
    user:{
        id: user._id,
        username: user.username,
        email: user.email,
        verified: user.verified,
    },
  });
}


export async function getMe(req,res){
    const userId = req.user.id;
    const user = await userModel.findById(userId);

    if(!user){
        return res.status(400).json({
            success: false,
            message: "User not found",
            err: "user not found",
        })
    }

    res.status(200).json({
        success: true,
        user
    });

}

export async function logoutUser(req, res) {
  const bearer =
    req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
  const token = req.cookies?.token || bearer || req.body?.token;

  try {
    if (token && redisClient && isRedisReady()) {
      let ttl = 7 * 24 * 60 * 60; // 7 days fallback
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
          const remaining = decoded.exp - Math.floor(Date.now() / 1000);
          if (remaining > 0) ttl = remaining;
        }
      } catch (e) {
        // use default 7 days TTL
      }
      await redisClient.set(`blacklist_${token}`, "true", "EX", ttl);
      console.log(`✅ [Auth] Token blacklisted successfully in Redis (TTL: ${ttl}s)`);
    }

    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });
    res.clearCookie("token");

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message,
    });
  }
}

// ============================================================
// GOOGLE OAUTH CALLBACK (Passport Integration matching Scapegoat)
// ============================================================

export async function googleCallback(req, res) {
  const passportUser = req.user;
  const frontendUrl = (process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? "https://parsuai.vercel.app" : "http://localhost:5173")).replace(/\/+$/, "");

  if (!passportUser) {
    return res.redirect(`${frontendUrl}/auth?error=auth_failed`);
  }

  const { id, displayName, emails, photos } = passportUser;
  const rawEmail = emails && emails.length > 0 ? emails[0].value : null;
  const email = rawEmail ? rawEmail.trim().toLowerCase() : null;
  const profilePic = photos && photos.length > 0 ? photos[0].value : undefined;

  if (!email) {
    return res.redirect(`${frontendUrl}/auth?error=google_no_email`);
  }

  try {
    // 1. Check if user exists by googleId
    const userByGoogle = await userModel.findOne({ googleId: id });

    // 2. Check if user exists by primary email or alternateEmails
    const userByEmail = await userModel.findOne({
      $or: [{ email }, { alternateEmails: email }]
    });

    let user;

    if (userByGoogle && userByEmail && userByGoogle._id.toString() !== userByEmail._id.toString()) {
      // CASE 1: Two separate accounts exist for the same user! Consolidate into userByEmail.
      const primaryUser = userByEmail;
      const secondaryUser = userByGoogle;

      // Migrate all chats from secondary to primary
      await chatModel.updateMany(
        { user: secondaryUser._id },
        { $set: { user: primaryUser._id } }
      );

      // Migrate all social connections
      await SocialConnection.updateMany(
        { user: secondaryUser._id },
        { $set: { user: primaryUser._id } }
      );

      // Save secondary's email as an alternate email of primary
      if (!primaryUser.alternateEmails) primaryUser.alternateEmails = [];
      if (secondaryUser.email && !primaryUser.alternateEmails.includes(secondaryUser.email.toLowerCase())) {
        primaryUser.alternateEmails.push(secondaryUser.email.toLowerCase());
      }

      // Delete secondary user first so unique googleId constraint isn't violated
      await userModel.deleteOne({ _id: secondaryUser._id });

      primaryUser.googleId = id;
      primaryUser.authProvider = "google";
      primaryUser.verified = true;
      if (profilePic && (!primaryUser.profilePic || primaryUser.profilePic.includes("pixabay"))) {
        primaryUser.profilePic = profilePic;
      }
      await primaryUser.save();
      user = primaryUser;

    } else if (userByEmail) {
      // CASE 2: User exists with this email/alternateEmail -> Link Google ID and chats
      user = userByEmail;
      user.googleId = id;
      user.authProvider = "google";
      user.verified = true;
      if (profilePic && (!user.profilePic || user.profilePic.includes("pixabay"))) {
        user.profilePic = profilePic;
      }
      await user.save();

    } else if (userByGoogle) {
      // CASE 3: User exists with this googleId, but email changed in Google profile
      user = userByGoogle;
      if (user.email.toLowerCase() !== email) {
        if (!user.alternateEmails) user.alternateEmails = [];
        if (!user.alternateEmails.includes(user.email.toLowerCase())) {
          user.alternateEmails.push(user.email.toLowerCase());
        }
        user.email = email;
      }
      user.verified = true;
      if (profilePic && (!user.profilePic || user.profilePic.includes("pixabay"))) {
        user.profilePic = profilePic;
      }
      await user.save();

    } else {
      // CASE 4: Brand new user
      const baseUsername = displayName?.replace(/\s+/g, '_').toLowerCase() || email.split('@')[0];
      let cleanUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '');
      if (!cleanUsername) cleanUsername = "user";
      let username = cleanUsername;
      let counter = 1;
      while (await userModel.findOne({ username })) {
        username = `${cleanUsername}_${counter++}`;
      }

      user = await userModel.create({
        username,
        email,
        googleId: id,
        authProvider: "google",
        profilePic,
      });
    }

    if (user.isBlocked) {
      return res.redirect(`${frontendUrl}/auth?error=account_blocked`);
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Pass token in URL parameter like Scapegoat so cross-origin requests have Bearer token
    res.redirect(`${frontendUrl}/auth?token=${token}`);
  } catch (error) {
    console.error("Google OAuth Callback Error:", error);
    res.redirect(`${frontendUrl}/auth?error=server_error`);
  }
}


export async function updateProfile(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { username, profilePic, preferredModel } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (username && username.trim()) {
      const trimmed = username.trim();
      if (trimmed !== user.username) {
        const existing = await userModel.findOne({ username: trimmed, _id: { $ne: userId } });
        if (existing) {
          return res.status(400).json({ success: false, message: "Username is already taken" });
        }
        user.username = trimmed;
      }
    }

    if (profilePic !== undefined && profilePic.trim()) {
      user.profilePic = profilePic.trim();
    }

    if (preferredModel !== undefined) {
      user.preferredModel = preferredModel;
    }

    // Email is strictly read-only and preserved per requirements
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        authProvider: user.authProvider,
        verified: user.verified,
        preferredModel: user.preferredModel,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile", error: err.message });
  }
}

// ============================================================
// FORGOT & RESET PASSWORD (OTP FLOW)
// ============================================================

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({
      $or: [{ email: cleanEmail }, { alternateEmails: cleanEmail }]
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address"
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Parsu - Password Reset Verification Code",
      html: `
        <div style="background-color: #000000; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100%;">
          <div style="background-color: #0a0a0a; max-width: 500px; margin: 0 auto; border-radius: 24px; border: 1px solid #2d2e2e; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
            <div style="padding: 48px; text-align: center;">
              <div style="width: 56px; height: 56px; background-color: #1a1a1a; border-radius: 16px; margin: 0 auto 32px; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
                 <span style="font-size: 28px;">🔐</span>
              </div>
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 16px; letter-spacing: -0.025em;">Password Reset Code</h1>
              <p style="color: #a1a1aa; font-size: 15px; line-height: 24px; margin-bottom: 32px;">
                Hi <strong style="color: #fff;">${user.username}</strong>, use the 6-digit verification code below to reset your password. This code will expire in <strong>10 minutes</strong>.
              </p>
              <div style="display: inline-block; background-color: #161616; border: 1px solid rgba(32, 184, 205, 0.4); padding: 18px 36px; border-radius: 16px; margin-bottom: 28px;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #20b8cd; font-family: monospace;">
                  ${otp}
                </span>
              </div>
              <p style="color: #71717a; font-size: 13px; line-height: 20px; margin: 0;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
          </div>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${user.email}`
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Failed to send reset code", error: err.message });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP code are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({
      $or: [{ email: cleanEmail }, { alternateEmails: cleanEmail }]
    }).select("+resetPasswordOtp +resetPasswordOtpExpires");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid verification code. Please check and try again." });
    }

    if (!user.resetPasswordOtpExpires || user.resetPasswordOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new code." });
    }

    res.status(200).json({
      success: true,
      message: "Code verified successfully"
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ success: false, message: "Failed to verify code", error: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one uppercase letter (A-Z)" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one number (0-9)" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({
      $or: [{ email: cleanEmail }, { alternateEmails: cleanEmail }]
    }).select("+resetPasswordOtp +resetPasswordOtpExpires +password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    if (!user.resetPasswordOtpExpires || user.resetPasswordOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new one." });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password."
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Failed to reset password", error: err.message });
  }
}

export async function changePassword(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must contain at least one uppercase letter" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must contain at least one number" });
    }

    const user = await userModel.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "You are logged in via Google OAuth. To set a password, please use the forgot password flow."
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, message: "Failed to change password", error: err.message });
  }
}