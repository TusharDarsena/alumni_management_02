/**
 * Test what the API returns for a profile
 */

import mongoose from "mongoose";
import AlumniProfile from "../models/AlumniProfile.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/alumni_db";

async function testApiResponse() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");

    const doc = await AlumniProfile.findOne({ id: "abhinav-shrivastava-b6a293204" })
      .select("id name about avatar position current_company experience education batch branch graduationYear updatedAt")
      .lean();

    if (!doc) {
      console.log("Profile not found!");
      await mongoose.disconnect();
      return;
    }

    // This mimics what the API endpoint returns
    const payload = {
      id: doc.id,
      name: doc.name,
      about: doc.about || null,
      avatar: doc.avatar || null,
      position: doc.position || doc.current_company?.title || null,
      current_company: doc.current_company || null,
      experience: Array.isArray(doc.experience) ? doc.experience : [],
      education: Array.isArray(doc.education) ? doc.education : [],
      batch: doc.batch || null,
      branch: doc.branch || null,
      graduationYear: doc.graduationYear || null,
    };

    console.log("API Response would be:");
    console.log(JSON.stringify({ success: true, data: payload }, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testApiResponse();
