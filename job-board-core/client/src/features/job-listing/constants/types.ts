import { z } from "zod";
import { jobListingSchema } from "./schema";

export type JobListing = z.infer<typeof jobListingSchema>
