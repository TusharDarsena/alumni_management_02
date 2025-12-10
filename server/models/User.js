import mongoose from "mongoose";
import { allowedBranches } from "../config/config.js";

const userSchema = new mongoose.Schema({
  // Clerk integration
  clerkId: {
    type: String,
    unique: true,
    sparse: true, // Allow null values, only enforce uniqueness when set
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: { type: String, required: true, trim: true },
  role: {
    type: String,
    enum: ["student", "faculty", "alumni", "admin"],
    default: "alumni",
  },
  isApproved: { type: Boolean, default: true },
  // Phone and branch
  phone: { type: String, unique: true, sparse: true, trim: true },
  branch: { 
    type: String, 
    enum: [...Object.values(allowedBranches).flatMap(d => d.branches), ""], 
    default: "CSE",
  },
  location: { type: String, trim: true },
  // Avatar URL from Clerk
  avatarUrl: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for common queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isApproved: 1 });

export default mongoose.models.User || mongoose.model("User", userSchema);
