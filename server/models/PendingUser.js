import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true }, // hashed on approval in User model
  role: {
    type: String,
    enum: ["student", "faculty", "alumni", "admin"],
    default: "student",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true,
  },
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpiresAt: Date,
  otpAttempts: { type: Number, default: 0 },
  otpLockedUntil: Date,
  lastOtpSentAt: Date,
  phone: { type: String, unique: true, sparse: true, trim: true },
  branch: { type: String, enum: ["CSE", "DSAI", "ECE"], required: false },
  mustChangePassword: { type: Boolean, default: false },
  defaultPassword: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// TTL index
pendingUserSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingUser", pendingUserSchema);
