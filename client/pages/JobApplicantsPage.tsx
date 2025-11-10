import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getJobListing } from "@/features/job-listing";
import { JobListing } from "@/features/job-listing";
import { JobApplicantsList } from "@/features/job-listing/components/JobApplicantsList";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserSummary } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function JobApplicantsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [jobListing, setJobListing] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (jobId) {
      loadJobListing();
    }
  }, [jobId]);

  async function loadJobListing() {
    try {
      setLoading(true);
      if (!jobId) return;
      const data = await getJobListing(jobId);
      setJobListing(data);
    } catch (error) {
      console.error("Failed to load job listing:", error);
    } finally {
      setLoading(false);
    }
  }

  const userForLayout: UserSummary = {
    name: authUser.username,
    email: authUser.email,
    avatarUrl: authUser.avatarUrl,
    notificationCount: authUser.notificationCount,
    mobile: authUser.phone,
    location: authUser.location,
  };

  return (
    <DashboardLayout activePage="My Job Listings" user={userForLayout}>
      <div className="p-6">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/my-job-listings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Listings
            </Link>
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ) : jobListing ? (
          <JobApplicantsList jobId={jobId!} jobTitle={jobListing.title} />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Job listing not found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
