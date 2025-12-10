import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // ✅ Added Link
import {
  JobListing,
  getPublishedListings,
  createNewJobListing,
} from "@/features/job-listing";
import JobListingGrid from "@/features/job-listing/components/JobListingGrid";
import { PublishedJobCard } from "@/features/job-listing";
import JobListingFilterForm from "@/features/job-listing/components/JobListingFilterForm";
import { useJobListingFilterForm } from "@/features/job-listing";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserSummary } from "@/components/DashboardLayout"; // ✅ Added UserSummary type
import { useAuth } from "@/hooks/useClerkAuth";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import JobListingForm from "@/features/job-listing/components/JobListingForm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { JobListingSkeletonGrid } from "@/features/job-listing";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"; // ✅ Added LoadingSpinner

export default function JobOpportunitiesPage() {
  const [listings, setListings] = useState<JobListing[] | null>(null);
  const { form, getFilteredJobListings } = useJobListingFilterForm();
  const { user: authUser } = useAuth(); // ✅ Renamed to authUser
  const toast = useToast();

  // Watch form values to trigger re-render when filters change
  const formValues = form.watch();

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

  async function handleCreate(values: any, close: () => void) {
    try {
      const created = await createNewJobListing(values as any);
      setListings((prev) => (prev ? [created, ...prev] : [created]));
      toast.toast({
        title: "Job created",
        description: "Job listing created successfully",
      });
      close();
    } catch (err: any) {
      console.error(err);
      toast.toast({
        title: "Error",
        description: err?.message || "Failed to create job",
      });
    }
  }

  const [createOpen, setCreateOpen] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleDialogClose = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      // User is trying to close with unsaved changes
      setShowConfirmClose(true);
    } else {
      setCreateOpen(open);
      if (!open) {
        setHasUnsavedChanges(false);
      }
    }
  };

  const confirmClose = () => {
    setShowConfirmClose(false);
    setCreateOpen(false);
    setHasUnsavedChanges(false);
  };

  const cancelClose = () => {
    setShowConfirmClose(false);
  };
  
  // ✅ Create the user object for the layout
  const userForLayout: UserSummary = {
    name: authUser.username, // Map username to name
    email: authUser.email,
    avatarUrl: authUser.avatarUrl,
    notificationCount: authUser.notificationCount,
    mobile: authUser.phone,
    location: authUser.location,
  };

  const content = (
    <div className="p-6">
      <PageHeader
        btnSection={
          // ✅ Wrapped buttons in a div
          <div className="flex items-center gap-2">
            {/* ✅ Added "Applied Jobs" Button */}
            <Button variant="outline" asChild>
              <Link to="/jobs/applied">My Applications</Link>
            </Button>
            
            {/* ✅ Added "My Job Listings" Button */}
            <Button variant="outline" asChild>
              <Link to="/jobs/my-listings">My Job Listings</Link>
            </Button>

            {/* Existing "Create Job" Button */}
            <Dialog open={createOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>Create Job</Button>
              </DialogTrigger>
              <DialogContent 
                className="max-w-5xl max-h-[90vh] overflow-y-auto"
                onInteractOutside={(e) => {
                  // Prevent closing when clicking outside if there are unsaved changes
                  if (hasUnsavedChanges) {
                    e.preventDefault();
                    setShowConfirmClose(true);
                  }
                }}
                onEscapeKeyDown={(e) => {
                  // Prevent closing with ESC if there are unsaved changes
                  if (hasUnsavedChanges) {
                    e.preventDefault();
                    setShowConfirmClose(true);
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle className="text-2xl">Create Job Listing</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to post a new job opportunity. All fields marked with * are required.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <JobListingForm
                    onSubmit={(values) => {
                      handleCreate(values, () => {
                        setCreateOpen(false);
                        setHasUnsavedChanges(false);
                      });
                    }}
                    onFormChange={() => setHasUnsavedChanges(true)}
                  />
                </div>
              </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for Unsaved Changes */}
            <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have unsaved changes. Are you sure you want to close this form? All your changes will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={cancelClose}>Continue Editing</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Discard Changes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      >
        Job Opportunities
      </PageHeader>

      <JobListingFilterForm form={form} />

      <div className="mt-6">
        {listings == null ? (
          <JobListingSkeletonGrid amount={6} />
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

  return (
    <DashboardLayout
      activePage="Job Opportunities"
      user={userForLayout} // ✅ Passed the correctly mapped user object
    >
      {content}
    </DashboardLayout>
  );
}