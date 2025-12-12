import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../../.env") });

async function makeAdmin() {
    const email = "abhinavshrivastava950@gmail.com";
    const clerkId = "user_36hh0iH3Ave3mXlG3Lw6CAZXYFn";

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const User = mongoose.connection.collection("users");

        // Find user by email or clerkId
        let user = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { clerkId }]
        });

        if (!user) {
            // User doesn't exist, create them
            console.log(`User not found, creating new admin user...`);

            const result = await User.insertOne({
                clerkId,
                email: email.toLowerCase(),
                username: email.split("@")[0], // Use email prefix as username
                role: "admin",
                branch: "CSE",
                isApproved: true,
                skills: [],
                experience: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            console.log(`✅ Successfully created admin user!`);
            console.log(`   - Email: ${email}`);
            console.log(`   - Role: admin`);
            console.log(`   - ClerkId: ${clerkId}`);
            console.log(`   - MongoDB _id: ${result.insertedId}`);
        } else {
            console.log("Found existing user:", {
                _id: user._id,
                email: user.email,
                username: user.username,
                currentRole: user.role,
                currentClerkId: user.clerkId,
            });

            // Update user to admin and link Clerk ID
            const result = await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        role: "admin",
                        clerkId: clerkId,
                        updatedAt: new Date()
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`✅ Successfully updated user to admin!`);
                console.log(`   - Email: ${email}`);
                console.log(`   - Role: admin`);
                console.log(`   - ClerkId: ${clerkId}`);
            } else {
                console.log("⚠️ No changes made (user may already have these values)");
            }
        }

        // Verify the final state
        const finalUser = await User.findOne({ email: email.toLowerCase() });
        console.log("\nVerified user state:", {
            _id: finalUser._id,
            email: finalUser.email,
            role: finalUser.role,
            clerkId: finalUser.clerkId,
        });

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB");
        process.exit(0);
    }
}

makeAdmin();
