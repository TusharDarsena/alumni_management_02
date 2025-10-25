import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import {
  JobListingFilterForm,
  JobListingGrid,
  JobListingSkeletonGrid,
  PublishedJobCard,
  useJobListingFilterForm,
} from "@/features/job-listing"
import { Await, useDeferredLoaderData } from "@/lib/reactRouter"
import { Suspense } from "react"
import { Link } from "react-router-dom"
import { loader } from "./Loader"

export function JobListings() {
  const { jobListingPromise } = useDeferredLoaderData<typeof loader>()
  const { form, getFilteredJobListings } = useJobListingFilterForm()

  return (
    <>
      <PageHeader
        btnSection={
          <Button variant="outline" asChild className="whitespace-nowrap">
            <Link to="/jobs/new">Create Listing</Link>
          </Button>
        }
      >
        Job Listings
      </PageHeader>
      <JobListingFilterForm form={form} />
      <Suspense fallback={<JobListingSkeletonGrid amount={6} />}>
        <Await resolve={jobListingPromise}>
          {(jobListings) => {
            const filteredJobs = getFilteredJobListings(jobListings)

            if (!filteredJobs || !filteredJobs.length) {
              return (
                <div className="text-slate-400">
                  No matching job Listings found
                </div>
              )
            }
            return (
              <JobListingGrid>
                {filteredJobs?.map((job) => {
                  return (
                    <PublishedJobCard
                      jobListing={job}
                      key={job.id}
                    />
                  )
                })}
              </JobListingGrid>
            )
          }}
        </Await>
      </Suspense>
    </>
  )
}
