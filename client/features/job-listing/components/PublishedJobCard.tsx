import { useState } from "react";
import JobListingCard from "./JobListingCard";
import { JobListing } from "../constants/types";
import { Button } from "@/components/ui/button";
import { JobDetailsModal } from "./JobDetailsModal";

type PublishedJobCardProps = {
  jobListing: JobListing;
};

function PublishedJobCard({ jobListing }: PublishedJobCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <>
      <JobListingCard 
        job={jobListing} 
        footerBtns={
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setDetailsOpen(true)}
          >
            Details
          </Button>
        } 
      />
      <JobDetailsModal 
        job={jobListing} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
      />
    </>
  );
}

export { PublishedJobCard };
