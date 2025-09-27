import jwt from "jsonwebtoken";
import User from "../models/User.js";
import PendingUser from "../models/PendingUser.js";
import { createToken } from "../utils/jwt.js";
import { sendMail } from "../utils/mailer.js";
import allowedBranches from "../config/branches.js";
import { generateToken, hashToken } from "../utils/token.js";
import { requireAuth } from "../middleware/auth.js";

const findOtpUser = async (email) => {
  const normalizedEmail = email.toLowerCase();
  let target = (await PendingUser.findOne({ email: normalizedEmail })) || (await User.findOne({ email: normalizedEmail }));
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
    const {
      email,
      username,
      password: providedPassword,
      role,
      phone,
      branch,
    } = req.body;
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
    if (!allowedBranches.includes(branch)) {
      return res.status(400).json({ message: "Invalid branch" });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const existingPhoneUser = (await User.findOne({ phone })) || (await PendingUser.findOne({ phone }));
    if (existingPhoneUser) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    const existingPending = await PendingUser.findOne({
      email: normalizedEmail,
    });
    if (existingPending) {
      return res.status(400).json({ message: "A request for this email is already in progress" });
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
    if (!email || !password) return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("User found in DB:", user ? `ID: ${user._id}, role: ${user.role}` : "No user");
    if (!user) return res.status(400).json({ message: "Incorrect email or password" });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(400).json({ message: "Incorrect email or password" });

    // Prevent login if email not verified
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    const token = createToken(user._id, user.tokenVersion || 0);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "User logged in",
      success: true,
      user: { username: user.username, email: user.email, role: user.role, isVerified: user.isVerified, mustChangePassword: user.mustChangePassword },
    });
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

// Verify token or email verification link
export const verifyHandler = async (req, res) => {
  try {
    const { token, email } = req.query || {};
    if (token && email) {
      // Public verification of email token
      const normalizedEmail = String(email).toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      if (!user.verificationTokenHash || !user.verificationExpires)
        return res.status(400).json({ success: false, message: "No verification token set" });
      if (new Date() > new Date(user.verificationExpires))
        return res.status(400).json({ success: false, message: "Verification token expired" });
      const hashed = hashToken(String(token));
      if (hashed !== user.verificationTokenHash)
        return res.status(400).json({ success: false, message: "Invalid verification token" });
      // token valid
      return res.json({ success: true });
    }

    // Otherwise behave like verifyUser that requires authentication
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
      return res.status(400).json({ success: false, message: "Password change on first login not required" });
    }

    const { newPassword } = req.body || {};
    if (!newPassword) {
      return res.status(400).json({ success: false, message: "New password is required" });
    }

    // Reject if new password equals current (default) password
    const sameAsOld = await user.comparePassword(newPassword);
    if (sameAsOld) {
      return res.status(400).json({ success: false, message: "New password cannot be the same as the default password" });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ success: false, message: "Password too weak. Use at least 8 characters with upper, lower, number, and special character." });
    }

    user.password = newPassword; // pre-save hook will hash
    user.mustChangePassword = false;
    user.defaultPassword = false;
    await user.save();

    // Invalidate other sessions by incrementing tokenVersion
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const refreshed = createToken(user._id, user.tokenVersion);
    res.cookie("token", refreshed, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

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
    if (!user) return res.status(404).json({ message: "User not found" });

    const last = user.verificationLastSentAt;
    if (last && new Date() - new Date(last) < 60 * 1000) {
      return res.status(429).json({ message: "Please wait before requesting another verification email." });
    }

    const token = generateToken();
    user.verificationTokenHash = hashToken(token);
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.verificationLastSentAt = new Date();
    await user.save();

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

export const resendVerification = async (req, res) => {
  // same as sendVerification but allow using existing route name
  return sendVerification(req, res);
};

export const setPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};
    if (!email || !token || !newPassword) return res.status(400).json({ message: "Email, token and newPassword are required" });

    if (!isStrongPassword(newPassword)) return res.status(400).json({ message: "Password too weak. Use at least 8 characters with upper, lower, number, and special character." });

    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.verificationTokenHash || !user.verificationExpires) return res.status(400).json({ message: "No verification token set" });
    if (new Date() > new Date(user.verificationExpires)) return res.status(400).json({ message: "Verification token expired" });
    const hashed = hashToken(String(token));
    if (hashed !== user.verificationTokenHash) return res.status(400).json({ message: "Invalid verification token" });

    // All good: set password and mark verified
    user.password = newPassword; // pre-save will hash
    user.isVerified = true;
    user.verificationTokenHash = null;
    user.verificationExpires = null;
    user.verificationLastSentAt = null;
    user.mustChangePassword = false;
    user.defaultPassword = false;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // invalidate existing sessions
    await user.save();

    return res.json({ success: true, message: "Password set and account verified" });
  } catch (err) {
    console.error("setPassword error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP endpoint used for both PendingUser and User
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const { target, error } = await findOtpUser(email);
    if (error) {
      const status = error === "Too many attempts. Try again later." ? 429 : 404;
      return res.status(status).json({ message: error });
    }

    if (!target.otp || !target.otpExpiresAt || new Date() > target.otpExpiresAt) {
      return res.status(400).json({ message: "OTP expired or not set" });
    }

    if (target.otp !== String(otp)) {
      target.otpAttempts = (target.otpAttempts || 0) + 1;
      if (target.otpAttempts >= 6) {
        target.otpLockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
      await target.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const isPending = !!target.status;
    target.isVerified = true;
    if (isPending) {
      target.status = "pending"; // move into admin review queue
    }
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
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const { target, error } = await findOtpUser(email);
    if (error) {
      const status = error === "Too many attempts. Try again later." ? 429 : 404;
      return res.status(status).json({ message: error });
    }

    const lastSent = target.lastOtpSentAt;
    if (lastSent && new Date() - new Date(lastSent) < 60 * 1000) {
      return res.status(429).json({ message: "Please wait before requesting another OTP." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    target.otp = otp;
    target.otpExpiresAt = otpExpiry;
    target.otpAttempts = 0;
    target.lastOtpSentAt = new Date();
    await target.save();

    const normalizedEmail = email.toLowerCase();

    try {
      await sendMail({
        to: normalizedEmail,
        subject: "Your OTP",
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      });
    } catch (e) {
      console.warn("Failed to send OTP email", e);
    }

    return res.json({ success: true, message: "OTP resent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
