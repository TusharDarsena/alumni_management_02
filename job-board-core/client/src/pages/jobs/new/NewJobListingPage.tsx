import { PageHeader } from "@/components/ui/PageHeader"
import { createNewJobListing, JobListingForm } from "@/features/job-listing"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function NewJobListingPage() {
  const navigate = useNavigate()
  return (
    <>
      <PageHeader>
        {" "}
        <div className="flex justify-start items-center gap-5">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer text-slate-300 hover:text-slate-200"
            onClick={() => navigate(-1)}
          />
          New Listing
        </div>
      </PageHeader>
      <JobListingForm
        onSubmit={async (values) => {
          await createNewJobListing(values)
          navigate("/jobs")
        }}
      />
    </>
  )
}
