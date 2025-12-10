import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserSummary } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useClerkAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { baseApi } from "@/services/baseApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Building2, DollarSign, Clock, ExternalLink } from "lucide-react";

interface JobListing {
  id: string;
  title: string;
  companyName: string;
  location: string;
  salary: number;
  type: string;
  experienceLevel: string;
  shortDescription: string;
  applyUrl: string;
  expiresAt: string;
}

interface Application {
  id: string;
  jobListingId: string;
  applicantId: string;
  linkedinUrl?: string;
  githubUrl?: string;
  personalNote: string;
  appliedAt: string;
  status: string;
  jobListing: JobListing;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels = {
  pending: "Pending Review",
  reviewed: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

export default function AppliedJobsPage() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuth();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await baseApi.get("/job-applications/my-applications");
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const userForLayout: UserSummary = {
    name: authUser.username,
    email: authUser.email,
    avatarUrl: authUser.avatarUrl,
    notificationCount: authUser.notificationCount,
    mobile: authUser.phone,
    location: authUser.location,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(salary);
  };

  return (
    <DashboardLayout activePage="Job Opportunities" user={userForLayout}>
      <div className="p-6">
        <PageHeader
          btnSection={
            <Button variant="outline" asChild>
              <Link to="/job-opportunities">Browse Jobs</Link>
            </Button>
          }
        >
          My Applications
        </PageHeader>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : applications && applications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center mb-4">
                  You haven't applied to any jobs yet.
                </p>
                <Button asChild>
                  <Link to="/job-opportunities">Browse Job Opportunities</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications?.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {application.jobListing?.title || "Job Title Unavailable"}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-base">
                          <Building2 className="h-4 w-4" />
                          {application.jobListing?.companyName || "Company Unavailable"}
                        </CardDescription>
                      </div>
                      <Badge 
                        className={statusColors[application.status as keyof typeof statusColors] || statusColors.pending}
                      >
                        {statusLabels[application.status as keyof typeof statusLabels] || application.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {application.jobListing && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {application.jobListing.shortDescription}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{application.jobListing.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>{formatSalary(application.jobListing.salary)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{application.jobListing.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Applied: {formatDate(application.appliedAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/job-opportunities/${application.jobListing.id}`}>
                              View Job Details
                            </Link>
                          </Button>
                          {application.jobListing.applyUrl && (
                            <Button asChild variant="ghost" size="sm">
                              <a 
                                href={application.jobListing.applyUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                Company Site
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
