import { allowedBranches as allowedDegrees } from "../../server/config/config.js";

export interface AlumniFilters {
  searchTerm: string;
  degree?: string;
  branch?: string;
  batch?: string;
}

export function filterAlumni(alumni: any[], filters: AlumniFilters): any[] {
  return alumni.filter((alum) => {
    // Degree filter
    if (filters.degree && filters.degree !== "any") {
      const degreeConfig = allowedDegrees[filters.degree as keyof typeof allowedDegrees];
      if (!degreeConfig) return false;
      const hasDegree = alum.education?.some((edu) =>
        edu.title === "IIIT-Naya Raipur" &&
        edu.field &&
        degreeConfig.branches.includes(edu.field)
      );
      if (!hasDegree) return false;
    }

    // Branch filter
    if (filters.branch && filters.branch !== "any") {
      const hasBranch = alum.education?.some((edu) =>
        edu.title === "IIIT-Naya Raipur" &&
        edu.field === filters.branch
      );
      if (!hasBranch) return false;
    }

    // Batch filter
    if (filters.batch && filters.batch !== "any") {
      const hasBatch = alum.education?.some((edu) =>
        edu.title === "IIIT-Naya Raipur" &&
        edu.start_year === filters.batch
      );
      if (!hasBatch) return false;
    }

    // Search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const matchesName = alum.name.toLowerCase().includes(term);
      const matchesId = alum.id.toLowerCase().includes(term);

      // Company from latest experience
      const latestExperience = alum.experience?.sort((a, b) =>
        new Date(b.start_date || "").getTime() - new Date(a.start_date || "").getTime()
      )[0];
      const matchesCompany = latestExperience?.company?.toLowerCase().includes(term);

      // Location from latest experience
      const matchesLocation = latestExperience?.location?.toLowerCase().includes(term);

      if (!matchesName && !matchesId && !matchesCompany && !matchesLocation) return false;
    }

    return true;
  });
}
