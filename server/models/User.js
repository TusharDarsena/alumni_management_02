import mongoose from "mongoose";
import { allowedBranches } from "../config/config.js";

const experienceSchema = new mongoose.Schema({
  company: { type: String, trim: true },
  title: { type: String, trim: true },
  from: { type: String, trim: true },
  to: { type: String, trim: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Clerk integration
  clerkId: {
    type: String,
    unique: true,
    sparse: true,
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

  // Basic profile fields
  phone: { type: String, unique: true, sparse: true, trim: true },
  branch: {
    type: String,
    enum: [...Object.values(allowedBranches).flatMap(d => d.branches), ""],
    default: "CSE",
  },
  location: { type: String, trim: true },
  avatarUrl: { type: String, trim: true },

  // Extended profile fields
  bio: { type: String, trim: true, maxlength: 500 },
  graduationYear: { type: String, trim: true },
  major: { type: String, trim: true },
  company: { type: String, trim: true },
  jobTitle: { type: String, trim: true },
  skills: [{ type: String, trim: true }],
  experience: [experienceSchema],
  linkedinUrl: { type: String, trim: true },

  // Timestamps
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
