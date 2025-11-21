import { Router } from "express";
import { z } from "zod";
import { zParse } from "../utils/zParse.js";
// `@prisma/client` may export a default interop object depending on installation and Node resolution.
// Use a safe default import and extract `PrismaClient` so both ESM/CJS shapes work.
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";

// Lazily load Prisma client at runtime. If the generated client is not present
// (e.g. `.prisma/client` not generated), the route handlers will return 503
// instead of crashing the whole server. This makes the feature optional during
// local dev when Prisma client generation hasn't been run.
let _prismaInstance = null;
async function ensurePrisma() {
  if (_prismaInstance) return _prismaInstance;
  try {
    // dynamic import so missing generated client doesn't crash module evaluation
    const mod = await import("@prisma/client");
    // `mod` might be the package namespace or a default wrapper
    const PrismaClient = (mod && (mod.PrismaClient ?? mod.default?.PrismaClient ?? mod.default)) || mod.PrismaClient;
    _prismaInstance = new PrismaClient();
    return _prismaInstance;
  } catch (err) {
    console.warn("Prisma client unavailable:", err && err.message ? err.message : err);
    return null;
  }
}

export const jobListingsRouter = Router();

const JOB_LISTING_TYPES = ["Full Time", "Part Time", "Internship"];
const JOB_LISTING_EXPERIENCE_LEVELS = ["Junior", "Mid-Level", "Senior"];

const ELIGIBLE_BRANCHES = [
  "CSE", 
  "DSAI", 
  "ECE",
  "CSE (Data Science/AI)",
  "CSE (Information Security)",
  "ECE (VLSI & Embedded Systems)",
  "ECE (Communication & Signal Processing)",
  "Computer Science and Engineering",
  "Electronics and Communication Engineering",
  "Mathematics",
  "Management Studies",
  "Physics",
  "Humanities",
  "All Branches"
];

const ELIGIBLE_ROLES = [
  "Alumni",
  "B.Tech",
  "M.Tech",
  "PhD",
  "Open for all"
];

const jobListingFormSchema = z.object({
  id: z.string().nonempty().optional(),
  title: z.string().nonempty(),
  companyName: z.string().nonempty(),
  location: z.string().nonempty(),
  applyUrl: z.string().url().nonempty(),
  type: z.enum(JOB_LISTING_TYPES),
  experienceLevel: z.enum(JOB_LISTING_EXPERIENCE_LEVELS),
  salary: z.number().int().positive(),
  shortDescription: z.string().max(200).nonempty(),
  description: z.string().nonempty(),
  eligibleBranches: z.array(z.enum(ELIGIBLE_BRANCHES)).min(1),
  eligibleRoles: z.array(z.enum(ELIGIBLE_ROLES)).min(1),
});

// Public: get published listings
jobListingsRouter.get("/published", async (req, res) => {
  const now = new Date();
  const prisma = await ensurePrisma();
  if (!prisma) return res.status(503).json({ message: "Prisma client unavailable" });
  const listings = await prisma.jobListing.findMany({
    where: { expiresAt: { gt: now } },
  });

  // Fetch poster information for each listing
  const listingsWithPosters = await Promise.all(
    listings.map(async (listing) => {
      let poster = null;
      if (listing.postedBy) {
        const posterUser = await User.findById(listing.postedBy).select("username email");
        poster = posterUser 
          ? { 
              id: posterUser._id.toString(), 
              username: posterUser.username, 
              email: posterUser.email 
            } 
          : null;
      }
      
      return {
        ...listing,
        poster,
        eligibleBranches: listing.eligibleBranches ? JSON.parse(listing.eligibleBranches) : [],
        eligibleRoles: listing.eligibleRoles ? JSON.parse(listing.eligibleRoles) : [],
      };
    })
  );

  res.json(listingsWithPosters);
});

// Get listings posted by the authenticated user
jobListingsRouter.get("/mine", requireAuth, async (req, res) => {
  const userId = req.user?._id?.toString();
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  const prisma = await ensurePrisma();
  if (!prisma) return res.status(503).json({ message: "Prisma client unavailable" });

  const listings = await prisma.jobListing.findMany({
    where: { postedBy: userId },
  });
  
  const parsedListings = listings.map(listing => ({
    ...listing,
    eligibleBranches: listing.eligibleBranches ? JSON.parse(listing.eligibleBranches) : [],
    eligibleRoles: listing.eligibleRoles ? JSON.parse(listing.eligibleRoles) : [],
  }));
  
  res.json(parsedListings);
});

// Create listing (authenticated)
jobListingsRouter.post("/", requireAuth, async (req, res) => {
  const body = await zParse(req.body, jobListingFormSchema, res);
  if (body == null) return;

  const prisma = await ensurePrisma();
  if (!prisma) return res.status(503).json({ message: "Prisma client unavailable" });

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(now.getDate() + 30);

  const userId = req.user?._id?.toString();


  const { eligibleBranches, eligibleRoles, ...restBody } = body;


  const jobListing = await prisma.jobListing.create({
    data: {
      ...restBody,
      postedAt: now,
      expiresAt,
      postedBy: userId,
      eligibleBranches: JSON.stringify(eligibleBranches),
      eligibleRoles: JSON.stringify(eligibleRoles),
    },
  });

  // Fetch poster information
  let poster = null;
  if (userId) {
    const posterUser = await User.findById(userId).select("username email");
    poster = posterUser 
      ? { 
          id: posterUser._id.toString(), 
          username: posterUser.username, 
          email: posterUser.email 
        } 
      : null;
  }

  // Return the listing with parsed arrays and poster info
  const parsedListing = {
    ...jobListing,
    eligibleBranches: eligibleBranches || [],
    eligibleRoles: eligibleRoles || [],
    poster: poster,
  };

  res.json(parsedListing);
});

jobListingsRouter.get("/:id", async (req, res) => {
  const id = req.params.id;

  const prisma = await ensurePrisma();
  if (!prisma) return res.status(503).json({ message: "Prisma client unavailable" });

  const jobListing = await prisma.jobListing.findUnique({ where: { id } });

  if (jobListing == null) {
    res.status(404).json({ message: "Job listing not found" });
    return;
  }

  const parsedListing = {
    ...jobListing,
    eligibleBranches: jobListing.eligibleBranches ? JSON.parse(jobListing.eligibleBranches) : [],
    eligibleRoles: jobListing.eligibleRoles ? JSON.parse(jobListing.eligibleRoles) : [],
  };

  res.json(parsedListing);
});

// Update listing - only owner or admin
jobListingsRouter.put("/:id", requireAuth, async (req, res) => {
  const body = await zParse(req.body, jobListingFormSchema, res);
  if (body == null) return;

  const id = req.params.id;
  const prisma = await ensurePrisma();
  if (!prisma) return res.status(503).json({ message: "Prisma client unavailable" });

  const jobListing = await prisma.jobListing.findUnique({ where: { id } });

  if (jobListing == null) {
    res.status(404).json({ message: "Job listing not found" });
    return;
  }

  const userId = req.user?._id?.toString();
  const isAdmin = req.user?.role === "admin";
  if (jobListing.postedBy && jobListing.postedBy !== userId && !isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { eligibleBranches, eligibleRoles, ...restBody } = body;

  const updatedJobListing = await prisma.jobListing.update({
    where: { id },
    data: {
      ...restBody,
      eligibleBranches: JSON.stringify(eligibleBranches),
      eligibleRoles: JSON.stringify(eligibleRoles),
    },
  });

  // Return the listing with parsed arrays
  const parsedListing = {
    ...updatedJobListing,
    eligibleBranches: eligibleBranches || [],
    eligibleRoles: eligibleRoles || [],
  };

  res.json(parsedListing);
});

// Delete listing - only owner or admin
jobListingsRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
  const prisma = await ensurePrisma();
  if (!prisma) return res.status(503).json({ message: "Prisma client unavailable" });

  const jobListing = await prisma.jobListing.findUnique({ where: { id } });

  if (jobListing == null) {
    res.status(404).json({ message: "Job listing not found" });
    return;
  }

  const userId = req.user?._id?.toString();
  const isAdmin = req.user?.role === "admin";
  if (jobListing.postedBy && jobListing.postedBy !== userId && !isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await prisma.jobListing.delete({ where: { id } });

  res.sendStatus(204);
});
