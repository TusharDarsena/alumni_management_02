/**
 * Debug script to check profile education data
 */

import mongoose from "mongoose";
import AlumniProfile from "../models/AlumniProfile.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/alumni_db";

async function debugProfile() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get specific profile to inspect
    const profile = await AlumniProfile.findOne({ id: "abhinav-shrivastava-b6a293204" }).lean();
    
    if (!profile) {
      console.log("Profile not found!");
      await mongoose.disconnect();
      return;
    }

    console.log("\n=================================");
    console.log("Name:", profile.name);
    console.log("ID:", profile.id);
    console.log("Branch stored:", profile.branch);
    console.log("Batch stored:", profile.batch);
    console.log("Education data:", JSON.stringify(profile.education, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

debugProfile();
