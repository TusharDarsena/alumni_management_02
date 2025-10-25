import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    JOB_LISTING_EXPERIENCE_LEVELS,
    JOB_LISTING_TYPES
} from "../constants/schema"
import { JobListing } from "../constants/types"

const jobListingFilterFormSchema = z.object({
    title: z.string(),
    location: z.string(),
    type: z.enum(JOB_LISTING_TYPES).or(z.literal("any")),
    minimumSalary: z.number().or(z.nan()),
    experienceLevel: z.enum(JOB_LISTING_EXPERIENCE_LEVELS).or(z.literal("any")),
})

export type JobListingFilterValues = z.infer<typeof jobListingFilterFormSchema>

export const DEFAULT_VALUES: JobListingFilterValues = {
    title: "",
    location: "",
    type: "any",
    minimumSalary: 0,
    experienceLevel: "any",
}


export function useJobListingFilterForm() {
    const form = useForm<JobListingFilterValues>({
        resolver: zodResolver(jobListingFilterFormSchema),
        defaultValues: DEFAULT_VALUES,
        mode: "onChange",
    })

    const values = form.watch()

    function getFilteredJobListings(jobListings: JobListing[] | undefined) {
        const listings = jobListings || []
        return listings.filter(job => {
            // Title filter - case insensitive substring match
            if (values.title && !job.title.toLowerCase().includes(values.title.toLowerCase())) {
                return false
            }

            // Location filter - case insensitive substring match
            if (values.location && !job.location.toLowerCase().includes(values.location.toLowerCase())) {
                return false
            }

            if (
                !isNaN(values.minimumSalary) &&
                job.salary < values.minimumSalary
            ) {
                return false
            }

            if (values.type !== "any" && job.type !== values.type) {
                return false
            }

            if (
                values.experienceLevel !== "any" &&
                job.experienceLevel !== values.experienceLevel
            ) {
                return false
            }

            return true
        })
    }
    return { form, getFilteredJobListings }
}
