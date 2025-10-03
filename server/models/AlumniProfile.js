import mongoose from "mongoose";

const alumniProfileSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Full name
  email: { type: String, default: null },

  // Profile info
  imageUrl: { type: String, default: null },
  linkedinUrl: { type: String, default: null },
  location: { type: String, default: null },

  // Education (can store multiple entries)
  education: [
    {
      degree: { type: String, default: null },
      institute: { type: String, default: null },
      startYear: { type: Number, default: null },
      endYear: { type: Number, default: null }
    }
  ],

  experience: [
    {
      role: { type: String, default: null },
      company: { type: String, default: null },
      location: { type: String, default: null },
      startYear: { type: Number, default: null },
      endYear: { type: mongoose.Schema.Types.Mixed, default: null }
      // can be Number or "Present"
    }
  ],

  skills: {
    technical: { type: [String], default: [] },
    core: { type: [String], default: [] }
  },

  graduationYear: { type: Number, default: null },
  batch: { type: String, default: null }, // optional label, e.g. "2017–2021"
  branch: { type: String, default: null }, // e.g. "CSE", "ECE"

}, { timestamps: true });

const AlumniProfile = mongoose.models.AlumniProfile || mongoose.model("AlumniProfile", alumniProfileSchema);

export default AlumniProfile;
