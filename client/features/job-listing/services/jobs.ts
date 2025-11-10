import { baseApi } from "@/services/baseApi";
import { z } from "zod";
import { jobListingSchema, jobListingFormSchema } from "../constants/schema";

export function getPublishedListings() {
  return baseApi
    .get("/job-listings/published")
    .then((res) => z.array(jobListingSchema).parseAsync(res.data))
    .catch(() => []);
}

export function createNewJobListing(
  data: z.infer<typeof jobListingFormSchema>,
) {
  return baseApi
    .post("/job-listings", data)
    .then((res) => jobListingSchema.parseAsync(res.data));
}

export function deleteListing(id: string) {
  return baseApi.delete(`/job-listings/${id}`);
}

export function getJobListing(id: string) {
  return baseApi
    .get(`/job-listings/${id}`)
    .then((res) => jobListingSchema.parseAsync(res.data));
}

export function editJobListing(
  id: string,
  data: z.infer<typeof jobListingFormSchema>,
) {
  return baseApi
    .put(`/job-listings/${id}`, data)
    .then((res) => jobListingSchema.parseAsync(res.data));
}

export function getAllMyListings() {
  return baseApi
    .get("/job-listings/mine")
    .then((res) => z.array(jobListingSchema).parseAsync(res.data))
    .catch(() => []);
}
