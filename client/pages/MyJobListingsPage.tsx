import { useEffect, useState } from "react";
import { getAllMyListings, deleteListing } from "@/features/job-listing";
import { JobListing } from "@/features/job-listing";
import { JobListingSkeletonGrid } from "@/features/job-listing";
import MyJobListingGrid from "@/features/job-listing/components/MyJobListingGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";

export default function MyJobListingsPage() {
  const [listings, setListings] = useState<JobListing[] | null>(null);
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    getAllMyListings().then((res) => {
      if (mounted) setListings(res);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleDelete(id: string) {
    try {
      await deleteListing(id);
      setListings((prev) => (prev ? prev.filter((j) => j.id !== id) : prev));
      toast.toast({ title: "Deleted", description: "Listing deleted" });
    } catch (err: any) {
      toast.toast({
        title: "Error",
        description: err?.message || "Failed to delete",
      });
    }
  }

  return (
    <DashboardLayout activePage="My Job Listings" user={{ name: "User" }}>
      <div className="p-6">
        <PageHeader
          btnSection={
            <Button variant="outline" asChild>
              <Link to="/job-opportunities">Browse Jobs</Link>
            </Button>
          }
        >
          My Job Listings
        </PageHeader>

        <div className="mt-6">
          {listings == null ? (
            <JobListingSkeletonGrid amount={6} />
          ) : (
            <MyJobListingGrid jobListings={listings} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
