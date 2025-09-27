import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import PendingUser from "../models/PendingUser.js";
import User from "../models/User.js";

const router = express.Router();

// Example admin-only route
router.get("/stats", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ message: "Admin stats", stats: { users: 123, active: 42 } });
});

// Fetch all pending user requests
router.get(
  "/pending-users",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const pending = await PendingUser.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .select("email username role status createdAt");
      res.json({ success: true, data: pending });
    } catch (err) {
      console.error("Fetch pending users error", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Approve a pending user
router.post(
  "/approve/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const pending = await PendingUser.findById(id);
      if (!pending || pending.status !== "pending") {
        return res.status(404).json({ success: false, message: "Pending user not found" });
      }

      const exists = await User.findOne({ email: pending.email });
      if (exists) {
        // Cleanup duplicate pending
        await PendingUser.findByIdAndDelete(id);
        return res.status(400).json({ success: false, message: "User already exists" });
      }

      // generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      const user = await User.create({
        email: pending.email,
        username: pending.username,
        password: pending.password, // will be hashed by User pre-save hook
        role: pending.role,
        isApproved: true,
        mustChangePassword: Boolean(pending.mustChangePassword),
        defaultPassword: Boolean(pending.defaultPassword),
        otp,
        otpExpiresAt: otpExpiry,
        phone: pending.phone,
        branch: pending.branch,
      });

      // send OTP email
      try {
        await import("../utils/mailer.js").then((m) => m.sendMail({
          to: user.email,
          subject: "Your account has been approved",
          text: `Your account has been approved. Please verify your email using OTP: ${otp}`,
        }));
      } catch (e) {
        console.warn("Failed to send approval email", e);
      }

      await PendingUser.findByIdAndDelete(id);

      return res.json({ success: true, message: "User approved", user: { id: user._id, email: user.email, username: user.username, role: user.role } });
    } catch (err) {
      console.error("Approve user error", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Reject a pending user
router.post(
  "/reject/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const removed = await PendingUser.findByIdAndDelete(id);
      if (!removed) {
        return res.status(404).json({ success: false, message: "Pending user not found" });
      }
      return res.json({ success: true, message: "User request rejected" });
    } catch (err) {
      console.error("Reject user error", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Admin: add user directly
router.post(
  "/add-user",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { email, username, password, role, phone, branch } = req.body || {};
      if (!email || !username || !password || !role || !phone || !branch) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }
      if (!["CSE", "DSAI", "ECE"].includes(branch)) {
        return res.status(400).json({ success: false, message: "Invalid branch" });
      }

      const normalizedEmail = email.toLowerCase();
      const exists = await User.findOne({ email: normalizedEmail });
      if (exists) return res.status(400).json({ success: false, message: "User already exists" });

      const phoneExists = await User.findOne({ phone }) || await PendingUser.findOne({ phone });
      if (phoneExists) return res.status(400).json({ success: false, message: "Phone number already in use" });

      // generate OTP for verification
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      const user = await User.create({
        email: normalizedEmail,
        username,
        password,
        role,
        phone,
        branch,
        isApproved: true,
        otp,
        otpExpiresAt: otpExpiry,
      });

      // send notification email with OTP
      try {
        await import("../utils/mailer.js").then((m) => m.sendMail({
          to: normalizedEmail,
          subject: "Your account has been created",
          text: `A user account has been created for you with email ${normalizedEmail}. Please verify your account by logging in. Your OTP is ${otp}`,
        }));
      } catch (e) {
        console.warn("Failed to send account creation email", e);
      }

      return res.json({ success: true, message: "User created", user: { id: user._id, email: user.email } });
    } catch (err) {
      console.error("Add user error", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

export default router;
