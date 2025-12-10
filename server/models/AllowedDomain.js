import mongoose from "mongoose";

const allowedDomainSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  addedBy: {
    type: String, // clerkId of admin who added it
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for quick lookups
allowedDomainSchema.index({ domain: 1, isActive: 1 });

export default mongoose.models.AllowedDomain || mongoose.model("AllowedDomain", allowedDomainSchema);
