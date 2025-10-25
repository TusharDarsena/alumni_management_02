import { getPublishedListings } from "@/features/job-listing"
import { deferredLoader } from "@/lib/reactRouter"

export const loader = deferredLoader(() => {
  return {
    jobListingPromise: getPublishedListings(),
  }
})
