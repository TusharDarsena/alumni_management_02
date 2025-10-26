import React, { useEffect, useState } from "react";
import { JobListing, getPublishedListings, createNewJobListing } from "@/features/job-listing";
import JobListingGrid from "@/features/job-listing/components/JobListingGrid";
import { PublishedJobCard } from "@/features/job-listing";
import JobListingFilterForm from "@/features/job-listing/components/JobListingFilterForm";
import { useJobListingFilterForm } from "@/features/job-listing";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import JobListingForm from "@/features/job-listing/components/JobListingForm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { JobListingSkeletonGrid } from "@/features/job-listing";
import { useToast } from "@/hooks/use-toast";

export default function JobOpportunitiesPage() {
  const [listings, setListings] = useState<JobListing[] | null>(null);
  const { form, getFilteredJobListings } = useJobListingFilterForm();
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    getPublishedListings().then((res) => {
      if (mounted) setListings(res);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = getFilteredJobListings(listings || []);

  async function handleCreate(values: any, close: () => void) {
    try {
      const created = await createNewJobListing(values as any);
      setListings((prev) => (prev ? [created, ...prev] : [created]));
      toast.toast({ title: "Job created", description: "Job listing created successfully" });
      close();
    } catch (err: any) {
      console.error(err);
      toast.toast({ title: "Error", description: err?.message || "Failed to create job" });
    }
  }

  const content = (
    <div className="p-6">
      <PageHeader btnSection={
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Job</Button>
          </DialogTrigger>
          <DialogContent>
            <div>
              <h2 className="text-lg font-semibold mb-4">Create Job Listing</h2>
              <JobListingForm onSubmit={(values) => handleCreate(values, () => {})} />
            </div>
          </DialogContent>
        </Dialog>
      }>
        Job Opportunities
      </PageHeader>

      <JobListingFilterForm form={form} />

      <div className="mt-6">
        {listings == null ? (
          <JobListingSkeletonGrid amount={6} />
        ) : (
          <JobListingGrid>
            {filtered.map((job) => (
              <PublishedJobCard key={job.id} jobListing={job} />
            ))}
          </JobListingGrid>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout activePage="Job Opportunities" user={user || { name: "User" }}>
      {content}
    </DashboardLayout>
  );
}
