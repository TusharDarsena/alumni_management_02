import JobListingCard from "./JobListingCard";
import { JobListing } from "../constants/types";

type PublishedJobCardProps = {
  jobListing: JobListing;
};

function PublishedJobCard({ jobListing }: PublishedJobCardProps) {
  return <JobListingCard job={jobListing} footerBtns={<div>Details</div>} />;
}

export { PublishedJobCard };
