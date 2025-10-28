import { Router } from "express";
import { z } from "zod";
import { zParse } from "../utils/zParse.js";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";

export const jobListingsRouter = Router();
const prisma = new PrismaClient();

const JOB_LISTING_TYPES = ["Full Time", "Part Time", "Internship"];
const JOB_LISTING_EXPERIENCE_LEVELS = ["Junior", "Mid-Level", "Senior"];

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
});

// Public: get published listings
jobListingsRouter.get("/published", async (req, res) => {
  const now = new Date();
  const listings = await prisma.jobListing.findMany({
    where: { expiresAt: { gt: now } },
  });
  res.json(listings);
});

// Get listings posted by the authenticated user
jobListingsRouter.get("/mine", requireAuth, async (req, res) => {
  const userId = req.user?._id?.toString();
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  const listings = await prisma.jobListing.findMany({
    where: { postedBy: userId },
  });
  res.json(listings);
});

// Create listing (authenticated)
jobListingsRouter.post("/", requireAuth, async (req, res) => {
  const body = await zParse(req.body, jobListingFormSchema, res);
  if (body == null) return;

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(now.getDate() + 30);

  const userId = req.user?._id?.toString();

  const jobListing = await prisma.jobListing.create({
    data: {
      ...body,
      postedAt: now,
      expiresAt,
      postedBy: userId,
    },
  });

  res.json(jobListing);
});

jobListingsRouter.get("/:id", async (req, res) => {
  const id = req.params.id;

  const jobListing = await prisma.jobListing.findUnique({ where: { id } });

  if (jobListing == null) {
    res.status(404).json({ message: "Job listing not found" });
    return;
  }

  res.json(jobListing);
});

// Update listing - only owner or admin
jobListingsRouter.put("/:id", requireAuth, async (req, res) => {
  const body = await zParse(req.body, jobListingFormSchema, res);
  if (body == null) return;

  const id = req.params.id;
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

  const updatedJobListing = await prisma.jobListing.update({
    where: { id },
    data: body,
  });

  res.json(updatedJobListing);
});

// Delete listing - only owner or admin
jobListingsRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
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
