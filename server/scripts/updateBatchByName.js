/**
 * Script to update batch field for alumni from IIIT-NR Batch Excel file
 * Reads multiple sheets (2015, 2016, 2017, 2019) and updates batch for each
 * Usage: node updateBatchByName.js
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
const EXCEL_FILE = path.join(__dirname, "../../IIIT-NR Batch.xlsx");

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
    console.log(`📂 Found sheets: ${workbook.SheetNames.join(", ")}\n`);

    let totalUpdated = 0;
    let totalNotFound = 0;

    for (const sheetName of workbook.SheetNames) {
        // Sheet name is the batch year
        const batch = sheetName.trim();
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log(`\n📄 Processing Sheet: ${sheetName} (Batch ${batch})`);
        console.log(`   ${data.length - 1} names found`);

        let updated = 0;
        let notFound = 0;
        const notFoundNames = [];

        // Skip header row (first row)
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const name = row[0]?.toString().trim();

            if (!name) continue;

            try {
                // Case-insensitive name search
                const result = await collection.updateOne(
                    { name: { $regex: new RegExp(name, "i") } },
                    { $set: { batch: batch } }
                );

                if (result.matchedCount > 0) {
                    updated++;
                } else {
                    notFound++;
                    notFoundNames.push(name);
                }
            } catch (error) {
                console.log(`   ❌ Error updating ${name}: ${error.message}`);
            }
        }

        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ⚠️ Not found: ${notFound}`);

        if (notFoundNames.length > 0 && notFoundNames.length <= 10) {
            console.log(`   Not found names: ${notFoundNames.join(", ")}`);
        } else if (notFoundNames.length > 10) {
            console.log(`   Not found (first 10): ${notFoundNames.slice(0, 10).join(", ")}...`);
        }

        totalUpdated += updated;
        totalNotFound += notFound;
    }

    console.log(`\n\n📊 TOTAL SUMMARY:`);
    console.log(`   Updated: ${totalUpdated}`);
    console.log(`   Not found: ${totalNotFound}`);

    // Show final batch distribution
    console.log("\n📊 Current Batch Distribution:");
    const stats = await collection.aggregate([
        { $group: { _id: { $ifNull: ["$batch", "NO BATCH"] }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]).toArray();
    stats.forEach(s => console.log(`   ${s._id}: ${s.count}`));

    await mongoose.disconnect();
    console.log("\n✅ Done!");
}

main().catch(console.error);
