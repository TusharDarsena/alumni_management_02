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

    // No password required for self-registration (alumni). They will be added to PendingUsers after verification and admin approval.

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const pending = await PendingUser.create({
      email: normalizedEmail,
      username,
      role: "alumni",
      status: "otp_sent",
      mustChangePassword: false,
      defaultPassword: false,
      phone,
      branch,
      otp,
      otpExpiresAt: otpExpiry,
      lastOtpSentAt: new Date(),
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

    const token = createToken(user._id, user.tokenVersion || 0);
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

export const logout = async (req, res) => {
  try {
    // If user is authenticated, increment tokenVersion to invalidate existing tokens
    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = jwt.decode(token);
        const userId = decoded?.id;
        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            await user.save();
          }
        }
      } catch (e) {
        console.warn("Could not decode token during logout", e);
      }
    }

    res.clearCookie("token");
    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true });
  } catch (err) {
    console.error("Logout error", err);
    res.status(500).json({ success: false });
  }
};

// Verify token
export const verifyUser = async (req, res) => {
  const user = req.user;
  res.setHeader("Cache-Control", "no-store");
  return res.json({
    status: true,
    user: user.username,
    role: user.role,
    mustChangePassword: Boolean(user.mustChangePassword),
    defaultPassword: Boolean(user.defaultPassword),
    isVerified: Boolean(user.isVerified),
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

    const refreshed = createToken(user._id, user.tokenVersion || 0);
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

// Verify OTP endpoint used for both PendingUser and User
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const normalizedEmail = email.toLowerCase();

    // check pending users first
    let pending = await PendingUser.findOne({ email: normalizedEmail });
    if (pending) {
      if (pending.otpLockedUntil && pending.otpLockedUntil > new Date()) {
        return res.status(429).json({ message: "Too many attempts. Try again later." });
      }
      if (!pending.otp || !pending.otpExpiresAt || new Date() > pending.otpExpiresAt) {
        return res.status(400).json({ message: "OTP expired or not set" });
      }
      if (pending.otp !== String(otp)) {
        pending.otpAttempts = (pending.otpAttempts || 0) + 1;
        if (pending.otpAttempts >= 6) {
          pending.otpLockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
        await pending.save();
        return res.status(400).json({ message: "Invalid OTP" });
      }
      pending.isVerified = true;
      pending.status = "pending"; // move into admin review queue
      pending.otp = undefined;
      pending.otpExpiresAt = undefined;
      pending.otpAttempts = 0;
      pending.otpLockedUntil = undefined;
      await pending.save();
      return res.json({ message: "Email verified successfully. Your request is queued for admin approval." });
    }

    // check real users
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
      return res.status(429).json({ message: "Too many attempts. Try again later." });
    }

    if (!user.otp || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: "OTP expired or not set" });
    }

    if (user.otp !== String(otp)) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 6) {
        user.otpLockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    user.otpLockedUntil = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const normalizedEmail = email.toLowerCase();

    let target = await PendingUser.findOne({ email: normalizedEmail }) || await User.findOne({ email: normalizedEmail });
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.otpLockedUntil && target.otpLockedUntil > new Date()) {
      return res.status(429).json({ message: "Too many attempts. Try again later." });
    }

    const lastSent = target.lastOtpSentAt;
    if (lastSent && (new Date() - new Date(lastSent)) < 60 * 1000) {
      return res.status(429).json({ message: "Please wait before requesting another OTP." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    target.otp = otp;
    target.otpExpiresAt = otpExpiry;
    target.otpAttempts = 0;
    target.lastOtpSentAt = new Date();
    await target.save();

    try {
      await sendMail({ to: normalizedEmail, subject: "Your OTP", text: `Your OTP is ${otp}. It expires in 10 minutes.` });
    } catch (e) {
      console.warn("Failed to send OTP email", e);
    }

    return res.json({ success: true, message: "OTP resent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
