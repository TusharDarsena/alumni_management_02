import { clerkMiddleware, getAuth, requireAuth as clerkRequireAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
import User from "../models/User.js";

/**
 * Initialize Clerk middleware - should be used at app level
 */
export { clerkMiddleware };

/**
 * Middleware that requires authentication and attaches MongoDB user to req.user
 * This maintains backward compatibility with existing route handlers
 */
export const requireAuth = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    
    if (!auth || !auth.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Look up the MongoDB user by clerkId
    let user = await User.findOne({ clerkId: auth.userId });
    
    if (!user) {
      // User exists in Clerk but not in our DB - this can happen if webhook failed
      // Try to create user from Clerk data
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        const primaryEmail = clerkUser.emailAddresses.find(
          e => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress;

        if (!primaryEmail) {
          return res.status(403).json({ message: "No email associated with account" });
        }

        // Create minimal user record - admin will need to complete profile
        user = await User.create({
          clerkId: auth.userId,
          email: primaryEmail.toLowerCase(),
          username: clerkUser.firstName 
            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
            : primaryEmail.split("@")[0],
          role: clerkUser.publicMetadata?.role || "alumni",
          phone: clerkUser.publicMetadata?.phone || "",
          branch: clerkUser.publicMetadata?.branch || "CSE",
          isApproved: true,
        });
      } catch (createError) {
        console.error("Failed to create user from Clerk data:", createError);
        return res.status(403).json({ message: "User profile not found. Please contact admin." });
      }
    }

    // Prevent caching of protected responses
    res.setHeader("Cache-Control", "no-store");

    // Attach user to request for backward compatibility
    req.user = user;
    req.auth = auth; // Also attach Clerk auth for access to session claims
    
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

/**
 * Middleware that checks if user has required role(s)
 * @param {string|string[]} role - Required role(s)
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userRole = req.user.role;
    
    if (Array.isArray(role)) {
      if (!role.includes(userRole)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else {
      if (userRole !== role) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    
    next();
  };
};

/**
 * Optional auth - attaches user if authenticated, continues if not
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    
    if (auth && auth.userId) {
      const user = await User.findOne({ clerkId: auth.userId });
      if (user) {
        req.user = user;
        req.auth = auth;
      }
    }
    
    next();
  } catch (err) {
    // Continue without auth on error
    next();
  }
};

/**
 * Sync user role to Clerk publicMetadata
 * Call this after updating user role in MongoDB
 */
export async function syncRoleToClerk(clerkId, role) {
  try {
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: { role },
    });
  } catch (err) {
    console.error("Failed to sync role to Clerk:", err);
  }
}
