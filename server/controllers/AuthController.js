import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import PendingUser from "../models/PendingUser.js";
import { createToken } from "../utils/jwt.js";
import { sendMail } from "../utils/mailer.js";
import allowedBranches from "../config/branches.js";
import { generateToken, hashToken } from "../utils/token.js";
import { requireAuth } from "../middleware/auth.js";

const hashOTP = (otp) => {
  const salt = "otp-salt"; // Fixed salt for simplicity; use unique per user in production
  return crypto.pbkdf2Sync(otp, salt, 10000, 64, "sha512").toString("hex");
};

const findOtpUser = async (email) => {
  const normalizedEmail = String(email).toLowerCase();
  const target = (await PendingUser.findOne({ email: normalizedEmail })) || (await User.findOne({ email: normalizedEmail }));
  if (!target) return { target: null, error: "User not found" };
  if (target.otpLockedUntil && target.otpLockedUntil > new Date()) {
    return { target: null, error: "Too many attempts. Try again later." };
  }
  return { target, error: null };
};

export const isStrongPassword = (pwd) => {
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
    const { email, username, role, phone, branch } = req.body || {};
    if (!email || !username) return res.status(400).json({ message: "Missing required fields" });

    // Only allow alumni self-registration
    if (role && role !== "alumni") return res.status(400).json({ message: "Self-registration allowed only for alumni" });

    if (!phone || !branch) return res.status(400).json({ message: "Phone and branch are required" });
    if (!allowedBranches.includes(branch)) return res.status(400).json({ message: "Invalid branch" });

    const normalizedEmail = String(email).toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const [existingUserPhone, existingPendingPhone] = await Promise.all([
      User.findOne({ phone }),
      PendingUser.findOne({ phone }),
    ]);
    const existingPhoneUser = existingUserPhone || existingPendingPhone;
    if (existingPhoneUser) return res.status(400).json({ message: "Phone number already in use" });

    const existingPending = await PendingUser.findOne({ email: normalizedEmail });
    if (existingPending) return res.status(400).json({ message: "A request for this email is already in progress" });

    // generate verification token for PendingUser
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const pending = await PendingUser.create({
      email: normalizedEmail,
      username,
      role: "alumni",
      status: "verification_sent",
      isVerified: false,
      mustChangePassword: false,
      defaultPassword: false,
      phone,
      branch,
      verificationTokenHash: tokenHash,
      verificationExpires: expiry,
      verificationLastSentAt: new Date(),
    });

    const base = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:8080";
    const link = `${base.replace(/\/$/, "")}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`;

    // send verification link (best-effort)
    try {
      await sendMail({
        to: normalizedEmail,
        subject: "Complete your registration",
        text: `Click the following link to verify your email and set your password: ${link}`,
        html: `<p>Click the link below to verify your email and set your password:</p><p><a href=\"${link}\">Verify email</a></p>`,
      });
    } catch (e) {
      console.warn("Failed to send verification email to pending user", e);
    }

    return res.status(201).json({
      success: true,
      message: "Your request has been submitted for admin approval. A verification link has been sent to your email to verify ownership.",
      pendingId: pending._id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(400).json({ message: "Incorrect email or password" });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(400).json({ message: "Incorrect email or password" });

    if (!user.isVerified) return res.status(403).json({ message: "Please verify your email before logging in." });

    const token = createToken(user._id, user.tokenVersion || 0);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 3 * 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      message: "User logged in",
      success: true,
      user: { username: user.username, email: user.email, role: user.role, isVerified: user.isVerified, mustChangePassword: user.mustChangePassword },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
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
    return res.json({ success: true });
  } catch (err) {
    console.error("Logout error", err);
    return res.status(500).json({ success: false });
  }
};

export const verifyHandler = async (req, res) => {
  try {
    const { token, email } = req.query || {};
    if (token && email) {
      const normalizedEmail = String(email).toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      if (user && user.verificationTokenHash && user.verificationExpires) {
        if (new Date() > new Date(user.verificationExpires)) return res.status(400).json({ success: false, message: "Verification token expired" });
        const hashed = hashToken(String(token));
        if (hashed !== user.verificationTokenHash) return res.status(400).json({ success: false, message: "Invalid verification token" });
        return res.json({ success: true });
      }

      const pending = await PendingUser.findOne({ email: normalizedEmail });
      if (pending && pending.verificationTokenHash && pending.verificationExpires) {
        if (new Date() > new Date(pending.verificationExpires)) return res.status(400).json({ success: false, message: "Verification token expired" });
        const hashed = hashToken(String(token));
        if (hashed !== pending.verificationTokenHash) return res.status(400).json({ success: false, message: "Invalid verification token" });
        return res.json({ success: true });
      }

      return res.status(404).json({ success: false, message: "User not found" });
    }

    return requireAuth(req, res, () => verifyUser(req, res));
  } catch (err) {
    console.error("Verification handler error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyUser = async (req, res) => {
  const user = req.user;
  res.setHeader("Cache-Control", "no-store");
  return res.json({
    status: true,
    user: {
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: Boolean(user.isVerified),
      mustChangePassword: Boolean(user.mustChangePassword),
    },
  });
};

export const changePasswordFirst = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.mustChangePassword || user.defaultPassword === false) {
      return res.status(400).json({ success: false, message: "Password change on first login not required" });
    }

    const { newPassword } = req.body || {};
    if (!newPassword) return res.status(400).json({ success: false, message: "New password is required" });

    const sameAsOld = await user.comparePassword(newPassword);
    if (sameAsOld) return res.status(400).json({ success: false, message: "New password cannot be the same as the default password" });

    if (!isStrongPassword(newPassword)) return res.status(400).json({ success: false, message: "Password too weak. Use at least 8 characters with upper, lower, number, and special character." });

    user.password = newPassword; // pre-save hook will hash
    user.mustChangePassword = false;
    user.defaultPassword = false;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const refreshed = createToken(user._id, user.tokenVersion);
    res.cookie("token", refreshed, { httpOnly: true, sameSite: "lax", maxAge: 3 * 24 * 60 * 60 * 1000 });

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const sendVerification = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email required" });
    const normalizedEmail = String(email).toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    const pending = await PendingUser.findOne({ email: normalizedEmail });

    if (!user && !pending) return res.status(404).json({ message: "User not found" });

    const target = user || pending;
    const last = target.verificationLastSentAt;
    if (last && new Date() - new Date(last) < 60 * 1000) return res.status(429).json({ message: "Please wait before requesting another verification email." });

    const token = generateToken();
    target.verificationTokenHash = hashToken(token);
    target.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    target.verificationLastSentAt = new Date();
    await target.save();

    const base = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:8080";
    const link = `${base.replace(/\/$/, "")}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`;

    try {
      await sendMail({
        to: normalizedEmail,
        subject: "Complete your account setup",
        text: `Click the following link to verify your email and set a password: ${link}`,
        html: `<p>Click the link below to verify your email and set your password:</p><p><a href=\"${link}\">Verify email</a></p>`,
      });
    } catch (e) {
      console.warn("Failed to send verification email", e);
      return res.status(500).json({ message: "Failed to send verification email" });
    }

    return res.json({ success: true, message: "Verification email sent" });
  } catch (err) {
    console.error("sendVerification error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const resendVerification = async (req, res) => sendVerification(req, res);

export const setPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};
    if (!email || !token || !newPassword) return res.status(400).json({ message: "Email, token and newPassword are required" });

    if (!isStrongPassword(newPassword)) return res.status(400).json({ message: "Password too weak. Use at least 8 characters with upper, lower, number, and special character." });

    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    const pending = await PendingUser.findOne({ email: normalizedEmail });
    if (!user && !pending) return res.status(404).json({ message: "User not found" });

    const target = user || pending;
    if (!target.verificationTokenHash || !target.verificationExpires) return res.status(400).json({ message: "No verification token set" });
    if (new Date() > new Date(target.verificationExpires)) return res.status(400).json({ message: "Verification token expired" });
    const hashed = hashToken(String(token));
    if (hashed !== target.verificationTokenHash) return res.status(400).json({ message: "Invalid verification token" });

    // All good: set password and mark verified
    target.password = newPassword; // pre-save will hash for User model; PendingUser password will be transferred on approval
    target.isVerified = true;
    target.verificationTokenHash = null;
    target.verificationExpires = null;
    target.verificationLastSentAt = null;
    target.mustChangePassword = false;
    target.defaultPassword = false;

    if (user) {
      target.tokenVersion = (target.tokenVersion || 0) + 1;
      await target.save();
      return res.json({ success: true, message: "Password set and account verified" });
    }

    // Pending user: mark status for admin review
    target.status = "pending";
    await target.save();
    return res.json({ success: true, message: "Password set and email verified. Your account is awaiting admin approval." });
  } catch (err) {
    console.error("setPassword error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const { target, error } = await findOtpUser(email);
    if (error) return res.status(error === 'Too many attempts. Try again later.' ? 429 : 404).json({ message: error });

    if (!target.otp || !target.otpExpiresAt || new Date() > target.otpExpiresAt) return res.status(400).json({ message: "OTP expired or not set" });

    const hashedOtp = hashOTP(otp);
    if (target.otp !== hashedOtp) {
      target.otpAttempts = (target.otpAttempts || 0) + 1;
      if (target.otpAttempts >= 6) target.otpLockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await target.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const isPending = !!target.status;
    target.isVerified = true;
    if (isPending) target.status = "pending";
    target.otp = undefined;
    target.otpExpiresAt = undefined;
    target.otpAttempts = 0;
    target.otpLockedUntil = undefined;
    await target.save();

    const message = isPending ? "Email verified successfully. Your request is queued for admin approval." : "Email verified successfully.";
    return res.json({ message });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email required" });

    const { target, error } = await findOtpUser(email);
    if (error) return res.status(error === 'Too many attempts. Try again later.' ? 429 : 404).json({ message: error });

    const lastSent = target.lastOtpSentAt;
    if (lastSent && new Date() - new Date(lastSent) < 60 * 1000) return res.status(429).json({ message: "Please wait before requesting another OTP." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const hashedOtp = hashOTP(otp);

    const normalizedEmail = String(email).toLowerCase();

    try {
      await sendMail({ to: normalizedEmail, subject: "Your OTP", text: `Your OTP is ${otp}. It expires in 10 minutes.` });
    } catch (e) {
      console.error("Failed to send OTP email", e);
      return res.status(500).json({ message: "Failed to send OTP email. Please try again later." });
    }

    target.otp = hashedOtp;
    target.otpExpiresAt = otpExpiry;
    target.otpAttempts = 0;
    target.lastOtpSentAt = new Date();
    await target.save();

    return res.json({ success: true, message: "OTP resent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
