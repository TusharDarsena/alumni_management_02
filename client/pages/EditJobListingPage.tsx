import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getJobListing,
  editJobListing,
  JobListingForm,
} from "@/features/job-listing";
import JobListingFormComponent from "@/features/job-listing/components/JobListingForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

export default function EditJobListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [initial, setInitial] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    getJobListing(id)
      .then((res) => {
        if (mounted) setInitial(res);
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!id) return <div>Not Found</div>;

  return (
    <DashboardLayout activePage="Edit Listing" user={{ name: "User" }}>
      <div className="p-6">
        <PageHeader>Edit Listing</PageHeader>
        {loading ? (
          <LoadingSpinner className="w-8 h-8" />
        ) : (
          <JobListingFormComponent
            initialJobListing={initial}
            onSubmit={async (values) => {
              try {
                await editJobListing(id, values as any);
                toast.toast({
                  title: "Updated",
                  description: "Listing updated",
                });
                navigate("/jobs/my-listings");
              } catch (err: any) {
                toast.toast({
                  title: "Error",
                  description: err?.message || "Failed to update",
                });
              }
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
