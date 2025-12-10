import express from "express";
import { requireAuth, requireRole, syncRoleToClerk } from "../middleware/clerkAuth.js";
import User from "../models/User.js";
import { allowedBranches } from "../config/config.js";
import {
  getAllowedDomains,
  addAllowedDomain,
  removeAllowedDomain,
} from "../utils/domainValidator.js";

const router = express.Router();

// ==========================================
// ALLOWED DOMAINS MANAGEMENT
// ==========================================

/**
 * GET /api/admin/allowed-domains
 * Fetch all allowed email domains
 */
router.get(
  "/allowed-domains",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const domains = await getAllowedDomains();
      res.json({ success: true, data: domains });
    } catch (err) {
      console.error("Fetch allowed domains error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/**
 * POST /api/admin/allowed-domains
 * Add a new allowed email domain
 */
router.post(
  "/allowed-domains",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { domain, description } = req.body || {};
      
      if (!domain || typeof domain !== "string") {
        return res.status(400).json({ success: false, message: "Domain is required" });
      }

      // Basic domain validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain.trim())) {
        return res.status(400).json({ success: false, message: "Invalid domain format" });
      }

      const newDomain = await addAllowedDomain(
        domain,
        req.user.clerkId || req.user._id.toString(),
        description || ""
      );

      res.status(201).json({ success: true, data: newDomain });
    } catch (err) {
      if (err.message === "Domain already exists") {
        return res.status(400).json({ success: false, message: err.message });
      }
      console.error("Add allowed domain error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/**
 * DELETE /api/admin/allowed-domains/:id
 * Remove (deactivate) an allowed domain
 */
router.delete(
  "/allowed-domains/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const success = await removeAllowedDomain(id);
      
      if (!success) {
        return res.status(404).json({ success: false, message: "Domain not found" });
      }

      res.json({ success: true, message: "Domain removed" });
    } catch (err) {
      console.error("Remove allowed domain error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// ==========================================
// USER MANAGEMENT
// ==========================================

/**
 * GET /api/admin/users
 * Fetch all users with optional filtering
 */
router.get(
  "/users",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { role, search, page = 1, limit = 50 } = req.query;
      
      const query = {};
      if (role) query.role = role;
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [users, total] = await Promise.all([
        User.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select("-__v"),
        User.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (err) {
      console.error("Fetch users error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/**
 * GET /api/admin/users/:id
 * Get single user details
 */
router.get(
  "/users/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-__v");
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, data: user });
    } catch (err) {
      console.error("Fetch user error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/**
 * PATCH /api/admin/users/:id
 * Update user (role, approval status, etc.)
 */
router.patch(
  "/users/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { role, isApproved, phone, branch, location } = req.body || {};
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Update fields
      if (role && ["student", "faculty", "alumni", "admin"].includes(role)) {
        user.role = role;
        // Sync role to Clerk if user has clerkId
        if (user.clerkId) {
          await syncRoleToClerk(user.clerkId, role);
        }
      }
      
      if (typeof isApproved === "boolean") {
        user.isApproved = isApproved;
      }
      
      if (phone !== undefined) {
        // Check for duplicate phone
        if (phone) {
          const phoneExists = await User.findOne({ 
            phone, 
            _id: { $ne: user._id } 
          });
          if (phoneExists) {
            return res.status(400).json({ success: false, message: "Phone number already in use" });
          }
        }
        user.phone = phone;
      }
      
      if (branch !== undefined) {
        const allBranches = Object.values(allowedBranches).flatMap(d => d.branches);
        if (branch && !allBranches.includes(branch)) {
          return res.status(400).json({ success: false, message: "Invalid branch" });
        }
        user.branch = branch;
      }
      
      if (location !== undefined) {
        user.location = location;
      }

      await user.save();

      res.json({ success: true, data: user });
    } catch (err) {
      console.error("Update user error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete(
  "/users/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Don't allow deleting self
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: "Cannot delete your own account" });
      }

      await User.findByIdAndDelete(req.params.id);

      res.json({ success: true, message: "User deleted" });
    } catch (err) {
      console.error("Delete user error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get(
  "/stats",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const [totalUsers, roleStats, recentUsers] = await Promise.all([
        User.countDocuments(),
        User.aggregate([
          { $group: { _id: "$role", count: { $sum: 1 } } },
        ]),
        User.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select("email username role createdAt"),
      ]);

      const domains = await getAllowedDomains();

      res.json({
        success: true,
        data: {
          totalUsers,
          roleStats: roleStats.reduce((acc, r) => {
            acc[r._id] = r.count;
            return acc;
          }, {}),
          recentUsers,
          allowedDomainsCount: domains.length,
        },
      });
    } catch (err) {
      console.error("Fetch admin stats error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

export default router;
