import { baseApi } from "../../../services/baseApi";
import { jobListingFormSchema } from "../../../../../api/src/constants/schemas/jobListings";
import { z } from "zod";
import { jobListingSchema } from "../constants/schema";

/**
 * GET /job-listings/published
 * This route will return all the published job listings. This is useful for getting the job listings to display on the job board.
 */
export function getPublishedListings() {
    return baseApi.get('job-listings/published').then(res => z.array(jobListingSchema).parseAsync(res.data)).catch(() => [])
}

/**
 * POST /job-listings
 * This route will create a new job listing. It will return the new job listing that was created.
 */
export function createNewJobListing(data: z.infer<typeof jobListingFormSchema>) {
    return baseApi.post('/job-listings', data).then(res => jobListingFormSchema.parseAsync(res.data))
}

export function deleteListing(id: string) {
    return baseApi.delete(`/job-listings/${id}`)
}

export function getJobListing(id: string) {
    return baseApi.get(`/job-listings/${id}`).then(
        res => jobListingFormSchema.parseAsync(res.data)
    )
}

/**
 * PUT /job-listings/:id - This route will update the job listing with the given id. It will return the updated job listing.
 */
export function editJobListing(id: string, data: z.infer<typeof jobListingFormSchema>) {
    return baseApi.put(`/job-listings/${id}`, data).then(
        res => jobListingFormSchema.parseAsync(res.data)
    )
}
