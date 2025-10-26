import { useForm } from "react-hook-form";
import { JobListing } from "../constants/types";

export type JobListingFilterValues = {
  title?: string;
  location?: string;
  minimumSalary?: number;
  type?: string | "any";
  experienceLevel?: string | "any";
};

export function useJobListingFilterForm(initialListings: JobListing[] = []) {
  const form = useForm<JobListingFilterValues>({
    defaultValues: {
      title: "",
      location: "",
      minimumSalary: undefined,
      type: "any",
      experienceLevel: "any",
    },
  });

  function getFilteredJobListings(jobListings?: JobListing[] | null) {
    const listings = jobListings || initialListings || [];
    return listings.filter((job) => {
      const vals = form.getValues();
      if (vals.title && !job.title.toLowerCase().includes(vals.title.toLowerCase())) return false;
      if (vals.location && !job.location.toLowerCase().includes(vals.location.toLowerCase())) return false;
      if (typeof vals.minimumSalary === "number" && !isNaN(vals.minimumSalary) && job.salary < vals.minimumSalary) return false;
      if (vals.type && vals.type !== "any" && job.type !== vals.type) return false;
      if (vals.experienceLevel && vals.experienceLevel !== "any" && job.experienceLevel !== vals.experienceLevel) return false;
      return true;
    });
  }

  return { form, getFilteredJobListings };
}
