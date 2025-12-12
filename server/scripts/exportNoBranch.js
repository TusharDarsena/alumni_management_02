/**
 * Script to export alumni without a branch to Excel
 * Usage: node exportNoBranch.js
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

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const OUTPUT_FILE = path.join(__dirname, "../../no_branch_alumni.xlsx");

async function main() {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI not found");
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const collection = mongoose.connection.collection("alumniprofiles");

    // Find all alumni without a branch
    const noBranchAlumni = await collection.find(
        { $or: [{ branch: null }, { branch: { $exists: false } }, { branch: "" }] },
        { projection: { name: 1, _id: 0 } }
    ).toArray();

    console.log(`📋 Found ${noBranchAlumni.length} alumni without a branch`);

    // Create Excel workbook
    const data = [["Name"]]; // Header row
    for (const alumni of noBranchAlumni) {
        data.push([alumni.name || "Unknown"]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "No Branch Alumni");

    XLSX.writeFile(workbook, OUTPUT_FILE);
    console.log(`✅ Exported to: ${OUTPUT_FILE}`);

    await mongoose.disconnect();
    console.log("✅ Done!");
}

main().catch(console.error);
