import { z } from "zod";

export const JOB_LISTING_TYPES = ["Full Time", "Part Time", "Internship"] as const;
export const JOB_LISTING_EXPERIENCE_LEVELS = ["Junior", "Mid-Level", "Senior"] as const;

export const jobListingFormSchema = z.object({
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

export const jobListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string(),
  location: z.string(),
  applyUrl: z.string().url(),
  type: z.enum(JOB_LISTING_TYPES),
  experienceLevel: z.enum(JOB_LISTING_EXPERIENCE_LEVELS),
  salary: z.number(),
  shortDescription: z.string(),
  description: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  postedAt: z.string().optional(),
});
