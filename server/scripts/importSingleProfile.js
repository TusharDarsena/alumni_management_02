/**
 * Import Single Alumni Profile
 * Usage: npx tsx server/scripts/importSingleProfile.js <filepath>
 */

import mongoose from "mongoose";
import AlumniProfile from "../models/AlumniProfile.js";
import { normalizeAlumniEntry } from "../utils/alumniNormalizer.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/alumni_db";

async function importProfile(filePath) {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Read the JSON file
    const fullPath = path.resolve(filePath);
    console.log("Reading file:", fullPath);
    
    if (!fs.existsSync(fullPath)) {
      console.error("File not found:", fullPath);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const profileData = JSON.parse(fileContent);

    console.log("Profile data loaded:", profileData.name, `(${profileData.id})`);

    // Normalize the entry
    const normalized = normalizeAlumniEntry(profileData);
    console.log("\nNormalized data:");
    console.log("- Branch:", normalized.branch);
    console.log("- Batch:", normalized.batch);
    console.log("- Graduation Year:", normalized.graduationYear);
    console.log("- Education:", JSON.stringify(normalized.education, null, 2));

    // Upsert to database
    const filter = normalized.linkedin_id 
      ? { linkedin_id: normalized.linkedin_id }
      : { id: normalized.id };

    const result = await AlumniProfile.updateOne(
      filter,
      { $set: normalized },
      { upsert: true }
    );

    console.log("\n✅ Import successful!");
    console.log("- Matched:", result.matchedCount);
    console.log("- Modified:", result.modifiedCount);
    console.log("- Upserted:", result.upsertedCount);

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: npx tsx server/scripts/importSingleProfile.js <filepath>");
  console.error("Example: npx tsx server/scripts/importSingleProfile.js client/data/updated_data/uabhinav-shrivastava-b6a293204.json");
  process.exit(1);
}

importProfile(filePath);
