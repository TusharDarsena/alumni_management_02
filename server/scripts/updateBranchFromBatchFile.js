/**
 * Script to update branch field from IIIT-NR Batch (1) Excel file
 * The file has CSE and ECE sections marked by headings
 * Usage: node updateBranchFromBatchFile.js
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
const EXCEL_FILE = path.join(__dirname, "../../IIIT-NR Batch (1).xlsx");

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

    let totalCseUpdated = 0;
    let totalEceUpdated = 0;
    let totalNotFound = 0;

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log(`\n📄 Processing Sheet: ${sheetName}`);

        let currentBranch = null;
        let cseUpdated = 0;
        let eceUpdated = 0;
        let notFound = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            // Check if this row is a branch header
            const rowStr = JSON.stringify(row).toUpperCase();

            if (rowStr.includes("CSE") && !rowStr.includes("ECE")) {
                currentBranch = "CSE";
                console.log(`   Found CSE section at row ${i}`);
                continue;
            }

            if (rowStr.includes("ECE") && !rowStr.includes("CSE")) {
                currentBranch = "ECE";
                console.log(`   Found ECE section at row ${i}`);
                continue;
            }

            // Skip if no branch context yet or if it's a header/title row
            if (!currentBranch) continue;

            // Look for name in the row (usually column 1 or 2)
            let name = null;
            for (let col = 0; col < Math.min(row.length, 5); col++) {
                const cell = row[col];
                if (typeof cell === "string" && cell.length > 3 && cell.length < 100) {
                    // Check if it looks like a name (not a URL, not a number)
                    if (!cell.includes("http") && !cell.includes("@") && !/^\d+$/.test(cell)) {
                        name = cell.trim();
                        break;
                    }
                }
            }

            if (!name) continue;
            if (name.toUpperCase().includes("BATCH") || name.toUpperCase() === "CSE" || name.toUpperCase() === "ECE") continue;

            try {
                const result = await collection.updateOne(
                    { name: { $regex: new RegExp(name, "i") } },
                    { $set: { branch: currentBranch } }
                );

                if (result.matchedCount > 0) {
                    if (currentBranch === "CSE") cseUpdated++;
                    else eceUpdated++;
                } else {
                    notFound++;
                }
            } catch (error) {
                // Ignore regex errors for special characters
            }
        }

        console.log(`   CSE updated: ${cseUpdated}`);
        console.log(`   ECE updated: ${eceUpdated}`);
        console.log(`   Not found: ${notFound}`);

        totalCseUpdated += cseUpdated;
        totalEceUpdated += eceUpdated;
        totalNotFound += notFound;
    }

    console.log(`\n\n📊 TOTAL SUMMARY:`);
    console.log(`   CSE Updated: ${totalCseUpdated}`);
    console.log(`   ECE Updated: ${totalEceUpdated}`);
    console.log(`   Not found: ${totalNotFound}`);

    // Show final branch distribution
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
