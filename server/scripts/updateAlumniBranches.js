/**
 * Update Alumni Branches Script
 * Re-extracts and updates branch information for all alumni profiles in MongoDB
 * Run this script whenever branch extraction logic changes
 */

import mongoose from "mongoose";
import AlumniProfile from "../models/AlumniProfile.js";
import { extractBatch, extractBranch, extractGraduationYear } from "../../shared/alumniUtils.ts";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/alumni_db";

async function updateAlumniBranches() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    console.log("Database:", mongoose.connection.db.databaseName);
    console.log("Collection:", AlumniProfile.collection.name);

    // Fetch all alumni profiles
    const alumni = await AlumniProfile.find({}).lean();
    console.log(`Found ${alumni.length} alumni profiles`);

    let updated = 0;
    let unchanged = 0;
    let errors = 0;
    const changes = [];

    for (const profile of alumni) {
      try {
        const educationData = profile.education;
        
        if (!Array.isArray(educationData)) {
          unchanged++;
          continue;
        }

        // Re-extract branch, batch, and graduation year
        const newBranch = extractBranch(educationData) || null;
        const newBatch = extractBatch(educationData) || null;
        const newGraduationYear = extractGraduationYear(educationData) || null;

        // Check if anything changed
        const branchChanged = profile.branch !== newBranch;
        const batchChanged = profile.batch !== newBatch;
        const graduationYearChanged = profile.graduationYear !== newGraduationYear;

        if (branchChanged || batchChanged || graduationYearChanged) {
          const updateData = {};
          
          if (branchChanged) updateData.branch = newBranch;
          if (batchChanged) updateData.batch = newBatch;
          if (graduationYearChanged) updateData.graduationYear = newGraduationYear;

          await AlumniProfile.updateOne(
            { _id: profile._id },
            { $set: updateData }
          );

          changes.push({
            id: profile.id,
            name: profile.name,
            old: {
              branch: profile.branch || null,
              batch: profile.batch || null,
              graduationYear: profile.graduationYear || null
            },
            new: {
              branch: newBranch,
              batch: newBatch,
              graduationYear: newGraduationYear
            }
          });

          updated++;
        } else {
          unchanged++;
        }
      } catch (error) {
        console.error(`Error updating profile ${profile.id}:`, error.message);
        errors++;
      }
    }

    console.log("\n========== UPDATE SUMMARY ==========");
    console.log(`Total profiles: ${alumni.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Unchanged: ${unchanged}`);
    console.log(`Errors: ${errors}`);
    console.log("====================================\n");

    if (changes.length > 0) {
      console.log("Changes made:");
      changes.forEach(change => {
        console.log(`\n${change.name} (${change.id}):`);
        if (change.old.branch !== change.new.branch) {
          console.log(`  Branch: ${change.old.branch || 'null'} → ${change.new.branch || 'null'}`);
        }
        if (change.old.batch !== change.new.batch) {
          console.log(`  Batch: ${change.old.batch || 'null'} → ${change.new.batch || 'null'}`);
        }
        if (change.old.graduationYear !== change.new.graduationYear) {
          console.log(`  Graduation Year: ${change.old.graduationYear || 'null'} → ${change.new.graduationYear || 'null'}`);
        }
      });
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
updateAlumniBranches();
