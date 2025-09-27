import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import PendingUser from "../models/PendingUser.js";
import User from "../models/User.js";
import allowedBranches from "../config/branches.js";
import { sendMail } from "../utils/mailer.js";
import { isStrongPassword } from "../controllers/AuthController.js";

const DEFAULT_PASS = process.env.DEFAULT_PASSWORD || "Welcome@123";

const createUserWithEmail = async (userData) => {
  const { email, username, password, role, phone, branch, isVerified = false } = userData;

  const isDefaultPassword = !password;
  const finalPassword = password || DEFAULT_PASS;

  // Send welcome email first to verify deliverability
  const mailRes = await sendMail({
    to: email,
    subject: "Your account has been created",
    text: `Your account has been created. Email: ${email}, Password: ${finalPassword}. ${isDefaultPassword ? 'Please log in and set a new password.' : 'Your password has been set by an admin.'}`,
  });
  if (!mailRes.ok) {
    throw new Error("Failed to send welcome email");
  }

  // Create user
  const user = await User.create({
    email,
    username,
    password: finalPassword,
    role,
    phone,
    branch,
    isApproved: true,
    isVerified,
    mustChangePassword: isDefaultPassword,
    defaultPassword: isDefaultPassword,
  });

  return user;
};

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
        return res
          .status(404)
          .json({ success: false, message: "Pending user not found" });
      }

      const exists = await User.findOne({ email: pending.email });
      if (exists) {
        // Cleanup duplicate pending
        await PendingUser.findByIdAndDelete(id);
        return res
          .status(400)
          .json({ success: false, message: "User already exists" });
      }

      if (pending.phone) {
        const phoneExists =
          (await User.findOne({ phone: pending.phone })) ||
          (await PendingUser.findOne({ phone: pending.phone, _id: { $ne: id } }));
        if (phoneExists) {
          return res
            .status(400)
            .json({ success: false, message: "Phone number already in use" });
        }
      }

      if (pending.branch && !allowedBranches.includes(pending.branch)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid branch" });
      }

      // Create user with email validation
      const user = await createUserWithEmail({
        email: pending.email,
        username: pending.username,
        role: pending.role,
        phone: pending.phone,
        branch: pending.branch,
        isVerified: Boolean(pending.isVerified),
      });

      await PendingUser.findByIdAndDelete(id);

      return res.json({
        success: true,
        message: "User approved",
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Approve user error", err);
      if (err.message === "Failed to send welcome email") {
        return res
          .status(400)
          .json({
            success: false,
            message: "Failed to send welcome email; user not created",
          });
      }
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
        return res
          .status(404)
          .json({ success: false, message: "Pending user not found" });
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
      if (!email || !username || !role || !phone || !branch) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }
      if (!allowedBranches.includes(branch)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid branch" });
      }

      if (password && !isStrongPassword(password)) {
        return res
          .status(400)
          .json({ success: false, message: "Password must be strong (8+ chars, upper, lower, digit, special)" });
      }

      const normalizedEmail = email.toLowerCase();
      const exists = await User.findOne({ email: normalizedEmail });
      if (exists)
        return res
          .status(400)
          .json({ success: false, message: "User already exists" });

      const phoneExists =
        (await User.findOne({ phone })) ||
        (await PendingUser.findOne({ phone }));
      if (phoneExists)
        return res
          .status(400)
          .json({ success: false, message: "Phone number already in use" });

      // Create user with email validation
      const user = await createUserWithEmail({
        email: normalizedEmail,
        username,
        password,
        role,
        phone,
        branch,
      });

      return res.json({
        success: true,
        message: "User created",
        user: { id: user._id, email: user.email },
      });
    } catch (err) {
      console.error("Add user error", err);
      if (err.message === "Failed to send welcome email") {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid email entered. User not created.",
          });
      }
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

export default router;
