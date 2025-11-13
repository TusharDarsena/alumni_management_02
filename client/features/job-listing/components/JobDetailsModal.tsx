import { useState } from "react";
import { JobListing } from "../constants/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/utils/formatters";
import { Banknote, CalendarDays, GraduationCap, MapPin, Building2, ExternalLink, User } from "lucide-react";
import { Link } from "react-router-dom";
import { JobApplicationModal } from "./JobApplicationModal";

type JobDetailsModalProps = {
  job: JobListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JobDetailsModal({ job, open, onOpenChange }: JobDetailsModalProps) {
  const [applicationOpen, setApplicationOpen] = useState(false);

  if (!job) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{job.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4" />
            {job.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Details Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="flex gap-1 whitespace-nowrap">
                <Banknote className="w-4 h-4" />
                {formatCurrency(job.salary)}
              </Badge>
              <Badge variant="secondary" className="flex gap-1 whitespace-nowrap">
                <CalendarDays className="w-4 h-4" />
                {job.type}
              </Badge>
              <Badge variant="secondary" className="flex gap-1 whitespace-nowrap">
                <GraduationCap className="w-4 h-4" />
                {job.experienceLevel}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Full Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Job Description</h3>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          <Separator />

          {/* Eligibility Criteria */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Eligibility Criteria</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <div>
                <p className="font-medium text-foreground mb-1">Eligible Branches:</p>
                <div className="flex flex-wrap gap-1">
                  {job.eligibleBranches && job.eligibleBranches.length > 0 ? (
                    job.eligibleBranches.map((branch) => (
                      <Badge key={branch} variant="outline">
                        {branch}
                      </Badge>
                    ))
                  ) : (
                    <span>All Branches</span>
                  )}
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Eligible Roles:</p>
                <div className="flex flex-wrap gap-1">
                  {job.eligibleRoles && job.eligibleRoles.length > 0 ? (
                    job.eligibleRoles.map((role) => (
                      <Badge key={role} variant="outline">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span>Open for all</span>
                  )}
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Experience Level:</p>
                <Badge variant="outline">{job.experienceLevel}</Badge>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Job Type:</p>
                <Badge variant="outline">{job.type}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Posted By Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Posted By</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm">
                  {job.poster?.username || "Anonymous"}
                </span>
              </div>
              {job.poster?.username && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/alumni/${job.poster.username}`}>View Profile</Link>
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Posted Date */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Posted On</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(job.postedAt)}
            </p>
          </div>

          <Separator />

          {/* Apply Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => setApplicationOpen(true)}>
              Apply Now
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Application Modal */}
      <JobApplicationModal
        job={job}
        open={applicationOpen}
        onOpenChange={setApplicationOpen}
      />
    </Dialog>
  );
}
