import { Router } from "express";
import { z } from "zod";
import { zParse } from "../utils/zParse.js";
import { PrismaClient } from "@prisma/client";

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

jobListingsRouter.get("/published", async (req, res) => {
  const now = new Date();
  const listings = await prisma.jobListing.findMany({ where: { expiresAt: { gt: now } } });
  res.json(listings);
});

jobListingsRouter.post("/", async (req, res) => {
  const body = await zParse(req.body, jobListingFormSchema, res);
  if (body == null) return;

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(now.getDate() + 30);

  const jobListing = await prisma.jobListing.create({
    data: {
      ...body,
      postedAt: now,
      expiresAt,
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

jobListingsRouter.put("/:id", async (req, res) => {
  const body = await zParse(req.body, jobListingFormSchema, res);
  if (body == null) return;

  const id = req.params.id;
  const jobListing = await prisma.jobListing.findUnique({ where: { id } });

  if (jobListing == null) {
    res.status(404).json({ message: "Job listing not found" });
    return;
  }

  const updatedJobListing = await prisma.jobListing.update({
    where: { id },
    data: body,
  });

  res.json(updatedJobListing);
});

jobListingsRouter.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const jobListing = await prisma.jobListing.findUnique({ where: { id } });

  if (jobListing == null) {
    res.status(404).json({ message: "Job listing not found" });
    return;
  }

  await prisma.jobListing.delete({ where: { id } });

  res.sendStatus(204);
});
