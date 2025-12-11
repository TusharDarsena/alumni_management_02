import express from "express";
import { requireAuth } from "../middleware/clerkAuth.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/portal - Get current user's profile
router.get("/", requireAuth, (req, res) => {
  const user = req.user;
  res.json({
    _id: user._id,
    clerkId: user.clerkId,
    email: user.email,
    username: user.username,
    role: user.role,
    phone: user.phone,
    branch: user.branch,
    location: user.location,
    isApproved: user.isApproved,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    // Extended profile fields
    bio: user.bio,
    graduationYear: user.graduationYear,
    major: user.major,
    company: user.company,
    jobTitle: user.jobTitle,
    skills: user.skills || [],
    experience: user.experience || [],
    linkedinUrl: user.linkedinUrl,
  });
});

// PUT /api/portal - Update current user's profile
router.put("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const allowedFields = [
      "username",
      "phone",
      "branch",
      "location",
      "bio",
      "graduationYear",
      "major",
      "company",
      "jobTitle",
      "skills",
      "experience",
      "linkedinUrl",
    ];

    // Build update object with only allowed fields
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Validate skills array
    if (updates.skills && !Array.isArray(updates.skills)) {
      return res.status(400).json({ error: "Skills must be an array" });
    }

    // Validate experience array
    if (updates.experience) {
      if (!Array.isArray(updates.experience)) {
        return res.status(400).json({ error: "Experience must be an array" });
      }
      // Validate each experience entry
      for (const exp of updates.experience) {
        if (typeof exp !== "object") {
          return res.status(400).json({ error: "Invalid experience entry" });
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        phone: updatedUser.phone,
        branch: updatedUser.branch,
        location: updatedUser.location,
        isApproved: updatedUser.isApproved,
        avatarUrl: updatedUser.avatarUrl,
        bio: updatedUser.bio,
        graduationYear: updatedUser.graduationYear,
        major: updatedUser.major,
        company: updatedUser.company,
        jobTitle: updatedUser.jobTitle,
        skills: updatedUser.skills || [],
        experience: updatedUser.experience || [],
        linkedinUrl: updatedUser.linkedinUrl,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
