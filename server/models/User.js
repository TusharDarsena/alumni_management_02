import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import allowedBranches from "../config/branches.js";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["student", "faculty", "alumni", "admin"],
    default: "student",
  },
  isApproved: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false },
  defaultPassword: { type: Boolean, default: false },
  resetOtpHash: String,
  resetOtpExpiry: Date,
  // OTP fields
  otp: String,
  otpExpiresAt: Date,
  otpAttempts: { type: Number, default: 0 },
  otpLockedUntil: Date,
  lastOtpSentAt: Date,
  // Email verification token fields
  verificationTokenHash: { type: String, default: null },
  verificationExpires: { type: Date, default: null },
  verificationLastSentAt: { type: Date, default: null },
  // Phone and branch
  phone: { type: String, unique: true, required: true, trim: true },
  branch: { type: String, enum: allowedBranches, required: true },
  location: { type: String, trim: true },
  // Token invalidation
  tokenVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// TTL index for otpExpiresAt to allow automatic expiry
userSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.models.User || mongoose.model("User", userSchema);
