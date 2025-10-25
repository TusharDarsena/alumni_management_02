import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { PageHeader } from "@/components/ui/PageHeader"
import { editJobListing, JobListingForm } from "@/features/job-listing"
import { Await, useDeferredLoaderData } from "@/lib/reactRouter"
import { Suspense } from "react"
import { useNavigate } from "react-router-dom"
import { loader } from "./loader"

function EditJobListingPage() {
  const navigate = useNavigate()
  const { jobListingsPromise, id } = useDeferredLoaderData<typeof loader>()
  return (
    <>
      <PageHeader>Edit Listing</PageHeader>
      <Suspense fallback={<LoadingSpinner className="w-8 h-8" />}>
        <Await resolve={jobListingsPromise}>
          {(jobListings) => (
            <JobListingForm
              initialJobListing={jobListings}
              onSubmit={async (jobListingValues) => {
                await editJobListing(id, jobListingValues)
                navigate("/jobs/my-listings")
              }}
            />
          )}
        </Await>
      </Suspense>
    </>
  )
}

export { EditJobListingPage }
