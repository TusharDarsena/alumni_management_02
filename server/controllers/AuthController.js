import jwt from "jsonwebtoken";
import User from "../models/User.js";
import PendingUser from "../models/PendingUser.js";
import { createToken } from "../utils/jwt.js";
import { sendMail } from "../utils/mailer.js";

const isStrongPassword = (pwd) => {
  if (typeof pwd !== "string") return false;
  if (pwd.length < 8) return false;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

export const signup = async (req, res) => {
  try {
    const { email, username, password: providedPassword, role, phone, branch } = req.body;
    if (!email || !username) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Only allow alumni self-registration
    if (role && role !== "alumni") {
      return res.status(400).json({ message: "Self-registration allowed only for alumni" });
    }

    if (!phone || !branch) {
      return res.status(400).json({ message: "Phone and branch are required" });
    }
    if (!["CSE", "DSAI", "ECE"].includes(branch)) {
      return res.status(400).json({ message: "Invalid branch" });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const existingPhoneUser = await User.findOne({ phone }) || await PendingUser.findOne({ phone });
    if (existingPhoneUser) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    const existingPending = await PendingUser.findOne({ email: normalizedEmail, status: "pending" });
    if (existingPending) {
      return res.status(400).json({ message: "A request for this email is already pending" });
    }

    const isDefaultPassword = false; // alumni must provide password

    if (!providedPassword) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (!isStrongPassword(providedPassword)) {
      return res.status(400).json({
        message:
          "Password too weak. Use at least 8 characters with upper, lower, number, and special character.",
      });
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const pending = await PendingUser.create({
      email: normalizedEmail,
      username,
      password: providedPassword,
      role: "alumni",
      status: "pending",
      mustChangePassword: false,
      defaultPassword: false,
      phone,
      branch,
      otp,
      otpExpiresAt: otpExpiry,
    });

    // send OTP email (best-effort)
    try {
      await sendMail({
        to: normalizedEmail,
        subject: "Verify your email",
        text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      });
    } catch (e) {
      console.warn("Failed to send OTP email", e);
    }

    return res.status(201).json({
      success: true,
      message: "Your request has been submitted for admin approval. An OTP has been sent to your email to verify ownership.",
      pendingId: pending._id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);
    if (!email || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("User found in DB:", user ? `ID: ${user._id}, role: ${user.role}` : 'No user');
    if (!user)
      return res.status(400).json({ message: "Incorrect email or password" });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Incorrect email or password" });

    const token = createToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "User logged in", success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
};

// Verify token
export const verifyUser = async (req, res) => {
  const user = req.user;
  return res.json({
    status: true,
    user: user.username,
    role: user.role,
    mustChangePassword: Boolean(user.mustChangePassword),
    defaultPassword: Boolean(user.defaultPassword),
  });
};

export const changePasswordFirst = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.mustChangePassword || user.defaultPassword === false) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password change on first login not required",
        });
    }

    const { newPassword } = req.body || {};
    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New password is required" });
    }

    // Reject if new password equals current (default) password
    const sameAsOld = await user.comparePassword(newPassword);
    if (sameAsOld) {
      return res
        .status(400)
        .json({
          success: false,
          message: "New password cannot be the same as the default password",
        });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password too weak. Use at least 8 characters with upper, lower, number, and special character.",
      });
    }

    user.password = newPassword; // pre-save hook will hash
    user.mustChangePassword = false;
    user.defaultPassword = false;
    await user.save();

    const refreshed = createToken(user._id);
    res.cookie("token", refreshed, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
