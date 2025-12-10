import express from "express";
import { requireAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  // accessible to any authenticated user
  // Return full user profile for frontend
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
  });
});

export default router;
