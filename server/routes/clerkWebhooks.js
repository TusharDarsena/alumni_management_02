import express from "express";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/express";
import User from "../models/User.js";
import { isEmailDomainAllowed, extractDomain } from "../utils/domainValidator.js";

const router = express.Router();

/**
 * Clerk webhook endpoint
 * Handles user lifecycle events from Clerk
 */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      console.error("CLERK_WEBHOOK_SECRET is not set");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    // Get the headers
    const svix_id = req.headers["svix-id"];
    const svix_timestamp = req.headers["svix-timestamp"];
    const svix_signature = req.headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: "Missing svix headers" });
    }

    // Get the body - it should be raw for webhook verification
    const body = req.body.toString();

    // Verify the webhook
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Webhook verification failed:", err.message);
      return res.status(400).json({ error: "Webhook verification failed" });
    }

    const eventType = evt.type;
    const data = evt.data;

    console.log(`Received Clerk webhook: ${eventType}`);

    try {
      switch (eventType) {
        case "user.created":
          await handleUserCreated(data);
          break;
        case "user.updated":
          await handleUserUpdated(data);
          break;
        case "user.deleted":
          await handleUserDeleted(data);
          break;
        default:
          console.log(`Unhandled webhook event: ${eventType}`);
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error(`Error handling webhook ${eventType}:`, err);
      return res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

/**
 * Handle user.created event from Clerk
 */
async function handleUserCreated(data) {
  const { id: clerkId, email_addresses, first_name, last_name, public_metadata } = data;
  
  // Get primary email
  const primaryEmailObj = email_addresses?.find(e => e.id === data.primary_email_address_id);
  const email = primaryEmailObj?.email_address?.toLowerCase();

  if (!email) {
    console.error("No email found for new user:", clerkId);
    return;
  }

  // Check if domain is allowed
  const isAllowed = await isEmailDomainAllowed(email);
  
  if (!isAllowed) {
    console.log(`User ${email} has unauthorized domain, marking for review`);
    // We don't delete the Clerk user, but we mark them as not approved
    // The frontend will show appropriate messaging
    try {
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          ...public_metadata,
          domainApproved: false,
          role: "alumni",
        },
      });
    } catch (err) {
      console.error("Failed to update user metadata:", err);
    }
  }

  // Check if user already exists (by email or clerkId)
  const existingUser = await User.findOne({
    $or: [{ email }, { clerkId }],
  });

  if (existingUser) {
    // Link existing user to Clerk
    if (!existingUser.clerkId) {
      existingUser.clerkId = clerkId;
      await existingUser.save();
      console.log(`Linked existing user ${email} to Clerk ID ${clerkId}`);
    }
    return;
  }

  // Create new user in MongoDB
  const username = first_name
    ? `${first_name} ${last_name || ""}`.trim()
    : email.split("@")[0];

  const newUser = await User.create({
    clerkId,
    email,
    username,
    role: public_metadata?.role || "alumni",
    phone: public_metadata?.phone || "",
    branch: public_metadata?.branch || "CSE",
    isApproved: isAllowed,
  });

  // Sync role back to Clerk
  try {
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role: newUser.role,
        domainApproved: isAllowed,
        mongoId: newUser._id.toString(),
      },
    });
  } catch (err) {
    console.error("Failed to sync metadata to Clerk:", err);
  }

  console.log(`Created new user: ${email} (${clerkId})`);
}

/**
 * Handle user.updated event from Clerk
 */
async function handleUserUpdated(data) {
  const { id: clerkId, email_addresses, first_name, last_name } = data;

  const user = await User.findOne({ clerkId });
  if (!user) {
    console.log(`User not found for update: ${clerkId}`);
    return;
  }

  // Get primary email
  const primaryEmailObj = email_addresses?.find(e => e.id === data.primary_email_address_id);
  const email = primaryEmailObj?.email_address?.toLowerCase();

  // Update user fields
  if (email && email !== user.email) {
    user.email = email;
    // Re-check domain approval if email changed
    user.isApproved = await isEmailDomainAllowed(email);
  }

  if (first_name || last_name) {
    const newUsername = `${first_name || ""} ${last_name || ""}`.trim();
    if (newUsername) {
      user.username = newUsername;
    }
  }

  await user.save();
  console.log(`Updated user: ${user.email}`);
}

/**
 * Handle user.deleted event from Clerk
 */
async function handleUserDeleted(data) {
  const { id: clerkId } = data;

  // Soft delete - just remove clerkId and mark as deleted
  const user = await User.findOne({ clerkId });
  if (user) {
    user.clerkId = null;
    user.isApproved = false;
    await user.save();
    console.log(`Soft deleted user: ${user.email}`);
  }
}

export default router;
