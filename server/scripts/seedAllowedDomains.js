/**
 * Seed initial allowed domains
 * 
 * Usage: node server/scripts/seedAllowedDomains.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import AllowedDomain from "../models/AllowedDomain.js";

dotenv.config();

const INITIAL_DOMAINS = [
  {
    domain: "iiitnr.edu.in",
    description: "IIIT Naya Raipur official domain",
    addedBy: "system",
  },
];

async function seedDomains() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  for (const domainData of INITIAL_DOMAINS) {
    const existing = await AllowedDomain.findOne({ domain: domainData.domain });
    
    if (existing) {
      console.log(`Domain already exists: ${domainData.domain}`);
      continue;
    }

    await AllowedDomain.create(domainData);
    console.log(`Created domain: ${domainData.domain}`);
  }

  console.log("\nDomain seeding complete!");
  
  const allDomains = await AllowedDomain.find({ isActive: true });
  console.log("\nActive domains:");
  allDomains.forEach(d => console.log(`  - ${d.domain}: ${d.description}`));

  await mongoose.disconnect();
  process.exit(0);
}

seedDomains().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
