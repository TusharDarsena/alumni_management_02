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
  mustChangePassword: { type: Boolean, default: false },
  defaultPassword: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PendingUser", pendingUserSchema);
