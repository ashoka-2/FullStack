import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";

export async function registerUser(req, res) {
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

  await sendEmail({
    to: email,
    subject: "Welcome to Perplexity - Please verify your email",
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
              Welcome to <strong style="color: #fff;">Perplexity</strong>, ${username}. We're excited to have you join our community of curious minds. Please click below to verify your account.
            </p>
            <a href="http://localhost:3000/api/auth/verify-email?token=${emailVerificationToken}" 
               style="display: inline-block; background-color: #20b8cd; color: #000; padding: 16px 40px; border-radius: 14px; font-size: 16px; font-weight: 700; text-decoration: none; transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 20px rgba(32, 184, 205, 0.15);">
              Verify Email Address
            </a>
            <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #1f1f1f;">
              <p style="color: #52525b; font-size: 13px; line-height: 20px; margin: 0;">
                If you didn't create an account, you can safely ignore this email.
              </p>
              <p style="color: #20b8cd; font-size: 13px; font-weight: 600; margin-top: 12px;">
                The Perplexity Team
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User registration failed",
    });
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
}


export async function resendVerificationEmail(req, res) {
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

  await sendEmail({
    to: email,
    subject: "Verify your Perplexity email",
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
              Hi ${user.username}, you requested a new verification link for your Perplexity account. This link will expire in 1 hour.
            </p>
            <a href="http://localhost:3000/api/auth/verify-email?token=${emailVerificationToken}" 
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

  res.status(200).json({
    success: true,
    message: "Verification email sent successfully",
  });
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

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";


  if (user.verified) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Success | Perplexity</title>
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
              <a href="${frontendUrl}/login" class="btn">Log In Here</a>
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
          <title>Verification Success | Perplexity</title>
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
              <p>Welcome aboard, ${user.username}. Your email has been successfully verified. You can now explore everything Perplexity has to offer.</p>
              <a href="${frontendUrl}/login" class="btn">Start Discovering</a>
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

  const user = await userModel
    .findOne({
      $or: [{ username }, { email }],
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
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  res.cookie("token", token);

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
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

export async function logoutUser(req,res){
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
}