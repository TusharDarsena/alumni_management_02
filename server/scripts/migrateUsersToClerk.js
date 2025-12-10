/**
 * Migration Script: Migrate existing MongoDB users to Clerk
 * 
 * This script:
 * 1. Reads all users from MongoDB
 * 2. Creates corresponding users in Clerk (with bcrypt password hash if supported)
 * 3. Saves the Clerk user ID back to MongoDB
 * 
 * Usage: 
 *   Set CLERK_SECRET_KEY in .env
 *   Run: node server/scripts/migrateUsersToClerk.js
 * 
 * Note: Users with unsupported password formats may need to reset their passwords
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { createClerkClient } from "@clerk/backend";

dotenv.config();

// Initialize Clerk
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// We need the old User schema that still has password field
// So we define it inline here for the migration
const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  role: String,
  isApproved: Boolean,
  isVerified: Boolean,
  phone: String,
  branch: String,
  location: String,
  clerkId: String,
  createdAt: Date,
});

const User = mongoose.model("UserMigration", userSchema, "users");

async function migrateUsers() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }

  if (!process.env.CLERK_SECRET_KEY) {
    console.error("CLERK_SECRET_KEY is not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  // Get users without clerkId (not yet migrated)
  const users = await User.find({ clerkId: { $exists: false } });
  console.log(`Found ${users.length} users to migrate`);

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (const user of users) {
    try {
      console.log(`\nMigrating: ${user.email}`);

      // Check if user already exists in Clerk by email
      const existingClerkUsers = await clerkClient.users.getUserList({
        emailAddress: [user.email],
      });

      let clerkUser;

      if (existingClerkUsers.data.length > 0) {
        // User already exists in Clerk, just link them
        clerkUser = existingClerkUsers.data[0];
        console.log(`  User already exists in Clerk: ${clerkUser.id}`);
      } else {
        // Create new user in Clerk
        const createParams = {
          emailAddress: [user.email],
          firstName: user.username?.split(" ")[0] || "",
          lastName: user.username?.split(" ").slice(1).join(" ") || "",
          publicMetadata: {
            role: user.role || "alumni",
            phone: user.phone || "",
            branch: user.branch || "",
            migratedFromMongo: true,
            mongoId: user._id.toString(),
          },
          skipPasswordChecks: true,
          skipPasswordRequirement: true,
        };

        // Try to import with bcrypt password hash if available
        if (user.password && user.password.startsWith("$2")) {
          createParams.passwordHasher = "bcrypt";
          createParams.passwordDigest = user.password;
          console.log("  Importing with bcrypt password hash");
        } else {
          console.log("  No password hash available, user will need to reset password");
        }

        try {
          clerkUser = await clerkClient.users.createUser(createParams);
          console.log(`  Created Clerk user: ${clerkUser.id}`);
        } catch (createErr) {
          // If password import fails, try without password
          if (createErr.message?.includes("password")) {
            console.log("  Password import failed, creating without password");
            delete createParams.passwordHasher;
            delete createParams.passwordDigest;
            clerkUser = await clerkClient.users.createUser(createParams);
            console.log(`  Created Clerk user (no password): ${clerkUser.id}`);
          } else {
            throw createErr;
          }
        }
      }

      // Update MongoDB user with clerkId
      await User.updateOne(
        { _id: user._id },
        { $set: { clerkId: clerkUser.id } }
      );
      console.log(`  Updated MongoDB with clerkId: ${clerkUser.id}`);

      results.success++;
    } catch (err) {
      console.error(`  Failed to migrate ${user.email}:`, err.message);
      results.failed++;
      results.errors.push({
        email: user.email,
        error: err.message,
      });
    }
  }

  console.log("\n========== MIGRATION COMPLETE ==========");
  console.log(`Success: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  
  if (results.errors.length > 0) {
    console.log("\nErrors:");
    results.errors.forEach(e => console.log(`  ${e.email}: ${e.error}`));
  }

  await mongoose.disconnect();
  process.exit(0);
}

migrateUsers().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
