import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB\n");

    const col = mongoose.connection.collection("alumniprofiles");

    // Get total count
    const total = await col.countDocuments();
    console.log(`Total alumni in database: ${total}\n`);

    // Get all unique batches
    const batches = await col.distinct("batch");
    console.log("All batches found:", batches.sort());

    console.log("\n\nComplete Batch & Branch Distribution:");
    console.log("======================================");

    for (const batch of batches.sort()) {
        if (!batch) continue; // Skip null/undefined batches

        const stats = await col.aggregate([
            { $match: { batch: batch } },
            { $group: { _id: { $ifNull: ["$branch", "NO BRANCH"] }, count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();

        const batchTotal = stats.reduce((sum, s) => sum + s.count, 0);
        console.log(`\nBatch ${batch}: (${batchTotal} total)`);
        stats.forEach(s => console.log(`  ${s._id}: ${s.count}`));
    }

    // Show users without batch
    const noBatch = await col.countDocuments({ $or: [{ batch: null }, { batch: { $exists: false } }] });
    console.log(`\n\nNo Batch Assigned: ${noBatch}`);

    await mongoose.disconnect();
}

main().catch(console.error);
