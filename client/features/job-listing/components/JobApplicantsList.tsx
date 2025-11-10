import { useEffect, useState } from "react";
import { getJobApplications, JobApplication, updateApplicationStatus } from "../services/applications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Github, Linkedin, Mail, MapPin, Briefcase, GraduationCap, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface JobApplicantsListProps {
  jobId: string;
  jobTitle: string;
}

export function JobApplicantsList({ jobId, jobTitle }: JobApplicantsListProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
  }, [jobId]);

  async function loadApplications() {
    try {
      setLoading(true);
      const data = await getJobApplications(jobId);
      setApplications(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(applicationId: string, status: "pending" | "reviewed" | "accepted" | "rejected") {
    try {
      await updateApplicationStatus(applicationId, status);
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status } : app
        )
      );
      toast({
        title: "Status Updated",
        description: `Application marked as ${status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update status",
        variant: "destructive",
      });
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "reviewed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Applicants for {jobTitle}</h2>
          <p className="text-muted-foreground">
            {applications.length} {applications.length === 1 ? "application" : "applications"} received
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No applications received yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => {
            const profile = application.alumniProfile;
            const applicant = application.applicant;
            const displayName = profile?.name || applicant?.username || "Unknown";
            const initials = displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card key={application.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={profile?.avatar} alt={displayName} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl mb-1">{displayName}</CardTitle>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {applicant?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span>{applicant.email}</span>
                            </div>
                          )}
                          {profile?.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span>{profile.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(application.status)} variant="outline">
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  {/* Profile Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Profile Details</h4>
                      <div className="space-y-1.5">
                        {(profile?.branch || applicant?.branch) && (
                          <div className="flex items-center gap-2 text-sm">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Branch:</span>
                            <span>{profile?.branch || applicant?.branch}</span>
                          </div>
                        )}
                        {applicant?.role && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Role:</span>
                            <Badge variant="secondary">{applicant.role}</Badge>
                          </div>
                        )}
                        {profile?.batch && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Batch:</span>
                            <span>{profile.batch}</span>
                          </div>
                        )}
                        {profile?.graduationYear && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Graduation Year:</span>
                            <span>{profile.graduationYear}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Current Position</h4>
                      <div className="space-y-1.5">
                        {profile?.position && (
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.position}</span>
                          </div>
                        )}
                        {profile?.currentCompany && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">at</span>
                            <span>{profile.currentCompany}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">Application Details</h4>
                    <div className="space-y-2">
                      {application.personalNote && (
                        <div className="rounded-lg bg-muted p-3 text-sm">
                          <p className="font-medium mb-1">Personal Note:</p>
                          <p className="text-muted-foreground">{application.personalNote}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {application.linkedinUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={application.linkedinUrl} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="h-4 w-4 mr-2" />
                              LinkedIn Profile
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        )}
                        {application.githubUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={application.githubUrl} target="_blank" rel="noopener noreferrer">
                              <Github className="h-4 w-4 mr-2" />
                              GitHub Profile
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Applied on {new Date(application.appliedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link to={`/alumni/${applicant?.id}`}>
                        View Profile
                      </Link>
                    </Button>
                    {application.status === "pending" && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleStatusChange(application.id, "reviewed")}
                        >
                          Mark as Reviewed
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange(application.id, "accepted")}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStatusChange(application.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {application.status === "reviewed" && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange(application.id, "accepted")}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStatusChange(application.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
