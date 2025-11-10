import { baseApi } from "@/services/baseApi";

export interface JobApplication {
  id: string;
  jobListingId: string;
  applicantId: string;
  linkedinUrl: string | null;
  githubUrl: string | null;
  personalNote: string;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  appliedAt: string;
  applicant: {
    id: string;
    username: string;
    email: string;
    branch?: string;
    role?: string;
  } | null;
  alumniProfile?: {
    name: string;
    branch?: string;
    batch?: string;
    graduationYear?: string;
    currentCompany?: string;
    position?: string;
    location?: string;
    avatar?: string;
  } | null;
}

export async function getJobApplications(jobId: string): Promise<JobApplication[]> {
  const response = await baseApi.get(`/job-applications/job/${jobId}`);
  return response.data;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "pending" | "reviewed" | "accepted" | "rejected"
): Promise<JobApplication> {
  const response = await baseApi.patch(`/job-applications/${applicationId}/status`, { status });
  return response.data;
}
