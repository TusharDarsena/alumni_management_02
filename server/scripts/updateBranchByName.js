/**
 * Script to update branch field for alumni from Excel files
 * Processes: CSE, ECE, DSAI alumni
 * Usage: node updateBranchByName.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const fs = require("fs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Excel files configuration - add more as needed
const BRANCH_FILES = [
    { file: "dsai alumnis.xlsx", branch: "DSAI" },
    { file: "cse alumnis.xlsx", branch: "CSE" },
    { file: "ece alumnis.xlsx", branch: "ECE" },
    { file: "Book3.xlsx", branch: null }, // Will be set via command line or skipped
];

async function connectDB() {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI not found in environment variables");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

function readNamesFromExcel(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const names = [];
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row && row[0] && typeof row[0] === "string") {
                const name = row[0].trim();
                if (name.toLowerCase() !== "name" && name.toLowerCase() !== "names" && name.length > 0) {
                    names.push(name);
                }
            }
        }
        return names;
    } catch (error) {
        console.error(`❌ Error reading ${filePath}: ${error.message}`);
        return [];
    }
}

async function updateBranches(names, targetBranch) {
    const collection = mongoose.connection.collection("alumniprofiles");

    let updated = 0;
    let notFound = 0;
    const notFoundNames = [];

    for (const name of names) {
        try {
            const result = await collection.updateOne(
                { name: { $regex: new RegExp(name, "i") } },
                { $set: { branch: targetBranch } }
            );

            if (result.matchedCount > 0) {
                console.log(`  ✅ Updated: ${name} → ${targetBranch}`);
                updated++;
            } else {
                notFound++;
                notFoundNames.push(name);
            }
        } catch (error) {
            console.log(`  ❌ Error updating ${name}: ${error.message}`);
        }
    }

    return { updated, notFound, notFoundNames };
}

async function showBranchStats() {
    const collection = mongoose.connection.collection("alumniprofiles");

    console.log("\n📊 Branch Distribution:");

    const stats = await collection.aggregate([
        {
            $group: {
                _id: { $ifNull: ["$branch", "NO BRANCH"] },
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]).toArray();

    for (const stat of stats) {
        console.log(`   ${stat._id}: ${stat.count}`);
    }
}

async function main() {
    await connectDB();

    console.log("\n📊 BEFORE UPDATE:");
    await showBranchStats();

    const projectRoot = path.join(__dirname, "../..");
    let totalUpdated = 0;
    let totalNotFound = 0;

    for (const config of BRANCH_FILES) {
        if (!config.branch) continue; // Skip files without a branch set

        const filePath = path.join(projectRoot, config.file);
        if (!fs.existsSync(filePath)) {
            console.log(`\n⚠️ File not found: ${config.file}`);
            continue;
        }

        console.log(`\n📄 Processing ${config.file} → ${config.branch}`);
        const names = readNamesFromExcel(filePath);

        if (names.length === 0) {
            console.log(`   No names found in file`);
            continue;
        }

        console.log(`   Found ${names.length} names`);
        const { updated, notFound, notFoundNames } = await updateBranches(names, config.branch);
        totalUpdated += updated;
        totalNotFound += notFound;

        console.log(`   Summary: ${updated} updated, ${notFound} not found`);

        if (notFoundNames.length > 0 && notFoundNames.length <= 10) {
            console.log(`   Not found: ${notFoundNames.join(", ")}`);
        } else if (notFoundNames.length > 10) {
            console.log(`   Not found (first 10): ${notFoundNames.slice(0, 10).join(", ")}...`);
        }
    }

    console.log(`\n📊 TOTAL: ${totalUpdated} updated, ${totalNotFound} not found`);

    console.log("\n📊 AFTER UPDATE:");
    await showBranchStats();

    await mongoose.disconnect();
    console.log("\n✅ Done! Disconnected from MongoDB");
}

main().catch(console.error);
