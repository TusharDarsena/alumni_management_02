import mongoose from "mongoose";
import allowedBranches from "../config/branches.js";

const pendingUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  username: { type: String, required: true, trim: true },
  password: { type: String }, // optional, set on approval
  role: {
    type: String,
    enum: ["student", "faculty", "alumni", "admin"],
    default: "student",
  },
  status: {
    type: String,
    enum: ["otp_sent", "pending", "approved", "rejected"],
    default: "otp_sent",
    index: true,
  },
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpiresAt: Date,
  otpAttempts: { type: Number, default: 0 },
  otpLockedUntil: Date,
  lastOtpSentAt: Date,
  phone: { type: String, unique: true, sparse: true, trim: true },
  branch: { type: String, enum: allowedBranches, required: false },
  mustChangePassword: { type: Boolean, default: false },
  defaultPassword: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// TTL index
pendingUserSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingUser", pendingUserSchema);
