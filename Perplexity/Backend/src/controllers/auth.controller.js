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
        <h1>Hi ${username}</h1>
        <h1>Welcome to <strong>Perplexity</strong></h1>
        <p>
        Thank you for registering on our platform. Please verify your email to start using Perplexity and explore the amazing features we offer.
        </p>
        <p></p>
        Click the link below to verify your email:
        </p>
        <a href="http://localhost:3000/api/auth/verify-email?token=${emailVerificationToken}">Verify Email</a>
        <p>If you didn't sign up for Perplexity, please ignore this email.</p>
        <p>Best regards,<br>The Perplexity Team</p>
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

  user.verified = true;
  await user.save();

  const html = `
    <h1>Email Verified Successfully</h1>
    <p>Hi ${user.username},</p>
    <p>Your email has been verified successfully.</p>
    <p>You can now log in to your account and start using Perplexity.</p>
    <a href="http://localhost:3000/api/auth/login">Log In</a>
    <p>Best regards,<br>The Perplexity Team</p>
    `;

    return res.status(200).send(html);

    } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Invalid token",
      err: err.message,
    });
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