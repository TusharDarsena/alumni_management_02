/**
 * Script to calculate and update experience richness score for alumni
 * This adds an 'experienceScore' field to alumni profiles
 * Usage: node updateExperienceScore.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function main() {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI not found");
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const collection = mongoose.connection.collection("alumniprofiles");

    // Get all alumni
    const allAlumni = await collection.find({}).toArray();
    console.log(`📋 Processing ${allAlumni.length} alumni...\n`);

    let updated = 0;

    for (const alumni of allAlumni) {
        const exp = alumni.experience || [];

        // Calculate experience score based on:
        // - Number of experience entries with both title and company
        // - Bonus for having detailed fields like description, start_date, etc.
        let score = 0;

        for (const e of exp) {
            if (e.title && e.company) {
                score += 10; // Base score for complete entry
                if (e.description) score += 5;
                if (e.start_date) score += 2;
                if (e.end_date) score += 2;
                if (e.location) score += 1;
            } else if (e.title || e.company) {
                score += 3; // Partial entry
            }
        }

        // Update the document with the score
        await collection.updateOne(
            { _id: alumni._id },
            { $set: { experienceScore: score } }
        );
        updated++;
    }

    console.log(`✅ Updated ${updated} alumni with experience scores`);

    // Show top 15 by score
    console.log("\n📊 Top 15 Alumni by Experience Score:");
    const top = await collection.find({}).sort({ experienceScore: -1 }).limit(15).toArray();
    top.forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.name}: ${a.experienceScore} points (${(a.experience || []).length} experiences)`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Done!");
}

main().catch(console.error);
