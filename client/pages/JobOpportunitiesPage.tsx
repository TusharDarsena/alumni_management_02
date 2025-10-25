import React, { useEffect, useState } from "react";
import { JobListing, getPublishedListings } from "@/features/job-listing";
import JobListingGrid from "@/features/job-listing/components/JobListingGrid";
import { PublishedJobCard } from "@/features/job-listing";
import JobListingFilterForm from "@/features/job-listing/components/JobListingFilterForm";
import { useJobListingFilterForm } from "@/features/job-listing";

export default function JobOpportunitiesPage() {
  const [listings, setListings] = useState<JobListing[] | null>(null);
  const { form, getFilteredJobListings } = useJobListingFilterForm();

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Job Opportunities</h1>
      <JobListingFilterForm form={form} />
      <div className="mt-6">
        {listings == null ? (
          <div>Loading...</div>
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
}
