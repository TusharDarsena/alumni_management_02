/**
 * Script to seed alumni profiles from updated_data folder
 * PRESERVES existing branch field - does not overwrite it
 * Usage: node seedUpdatedData.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require("fs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const DATA_DIR = path.join(__dirname, "../../client/data/updated_data");

async function main() {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI not found");
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const collection = mongoose.connection.collection("alumniprofiles");

    // Read all JSON files from updated_data directory
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
    console.log(`📂 Found ${files.length} JSON files in updated_data\n`);

    let updated = 0;
    let inserted = 0;
    let errors = 0;

    for (const file of files) {
        try {
            const filePath = path.join(DATA_DIR, file);
            const content = fs.readFileSync(filePath, "utf-8");
            const data = JSON.parse(content);

            // Get linkedin_id or id for matching
            const linkedin_id = data.linkedin_id || data.id || data.input?.url?.split("/").pop();

            if (!linkedin_id) {
                console.log(`  ⚠️ Skipped ${file}: No linkedin_id found`);
                continue;
            }

            // Check if alumni already exists
            const existingAlumni = await collection.findOne({ linkedin_id });

            // Prepare update data - remove branch so we don't overwrite it
            const updateData = { ...data };
            delete updateData.branch; // Don't overwrite branch
            delete updateData._id; // Don't try to update _id

            // Add linkedin_id if not present
            updateData.linkedin_id = linkedin_id;
            updateData.id = updateData.id || linkedin_id;

            if (existingAlumni) {
                // Update existing document, but preserve branch
                await collection.updateOne(
                    { linkedin_id },
                    { $set: updateData }
                );
                console.log(`  ✅ Updated: ${data.name || file} (branch preserved: ${existingAlumni.branch || "none"})`);
                updated++;
            } else {
                // Insert new document (no branch to preserve)
                await collection.insertOne(updateData);
                console.log(`  ➕ Inserted: ${data.name || file}`);
                inserted++;
            }
        } catch (error) {
            console.log(`  ❌ Error processing ${file}: ${error.message}`);
            errors++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Errors: ${errors}`);

    // Show branch distribution
    console.log("\n📊 Current Branch Distribution:");
    const stats = await collection.aggregate([
        { $group: { _id: { $ifNull: ["$branch", "NO BRANCH"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]).toArray();
    stats.forEach(s => console.log(`   ${s._id}: ${s.count}`));

    await mongoose.disconnect();
    console.log("\n✅ Done!");
}

main().catch(console.error);
