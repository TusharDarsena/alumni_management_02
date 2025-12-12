/**
 * Script to process 2017 batch Excel file with mixed CSE/ECE students
 * Handles "ECE-> CSE" as CSE students
 * Usage: node process2017Batch.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const EXCEL_FILE = path.join(__dirname, "../../2017 batch (1).xlsx");

async function main() {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI not found");
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const collection = mongoose.connection.collection("alumniprofiles");

    // Read Excel file
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`📄 Processing ${data.length - 1} students from 2017 batch\n`);

    // Process rows (skip header)
    let cseUpdated = 0, eceUpdated = 0, notFound = 0;
    const notFoundNames = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const name = row[2]?.toString().trim(); // Name column (index 2)
        let branch = row[7]?.toString().trim(); // Branch Allotted column (index 7)

        if (!name) continue;

        // Handle "ECE-> CSE" as CSE
        if (branch && (branch.includes("ECE->") || branch.includes("ECE->"))) {
            branch = "CSE";
        }

        // Normalize branch
        if (branch === "CSE" || branch === "ECE") {
            try {
                const result = await collection.updateOne(
                    { name: { $regex: new RegExp(name, "i") } },
                    { $set: { branch: branch, batch: "2017" } }
                );

                if (result.matchedCount > 0) {
                    if (branch === "CSE") cseUpdated++;
                    else eceUpdated++;
                    console.log(`  ✅ ${name} → ${branch}`);
                } else {
                    notFound++;
                    notFoundNames.push(`${name} (${branch})`);
                }
            } catch (error) {
                console.log(`  ❌ Error: ${name}: ${error.message}`);
            }
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   CSE updated: ${cseUpdated}`);
    console.log(`   ECE updated: ${eceUpdated}`);
    console.log(`   Not found: ${notFound}`);

    if (notFoundNames.length > 0) {
        console.log(`\n📋 Not found in database:`);
        notFoundNames.forEach(n => console.log(`   - ${n}`));
    }

    // Show final stats
    console.log("\n📊 Final Branch Distribution:");
    const stats = await collection.aggregate([
        { $group: { _id: { $ifNull: ["$branch", "NO BRANCH"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]).toArray();
    stats.forEach(s => console.log(`   ${s._id}: ${s.count}`));

    await mongoose.disconnect();
    console.log("\n✅ Done!");
}

main().catch(console.error);
