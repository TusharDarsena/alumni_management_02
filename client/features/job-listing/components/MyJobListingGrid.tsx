import JobListingGrid from "./JobListingGrid";
import JobListingCard from "./JobListingCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { JobListing } from "../constants/types";

type Props = {
  jobListings: JobListing[];
  onDelete?: (id: string) => void;
};

export default function MyJobListingGrid({ jobListings, onDelete }: Props) {
  return (
    <JobListingGrid>
      {jobListings.map((job) => (
        <JobListingCard
          key={job.id}
          job={job}
          footerBtns={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to={`/jobs/${job.id}/applicants`}>View Applicants</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to={`/jobs/edit/${job.id}`}>Edit</Link>
              </Button>
              <Button
                variant="destructive"
                onClick={() => onDelete && onDelete(job.id)}
              >
                Delete
              </Button>
            </div>
          }
        />
      ))}
    </JobListingGrid>
  );
}
