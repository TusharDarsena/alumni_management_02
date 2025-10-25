import { z } from "zod"

export const JOB_LISTING_TYPES = [
  "Full Time",
  "Part Time",
  "Internship",
] as const

export const JOB_LISTING_EXPERIENCE_LEVELS = [
  "Junior",
  "Mid-Level",
  "Senior",
] as const

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
    createdAt: z.string(),
    updatedAt: z.string(),
    expiresAt: z.string(),
    postedAt: z.string(),
})
