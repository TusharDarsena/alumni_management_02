import { useState } from "react";
import { JobListing } from "../constants/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

const applicationFormSchema = z.object({
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Please enter a valid GitHub URL").optional().or(z.literal("")),
  personalNote: z.string().min(10, "Please write at least 10 characters").max(500, "Maximum 500 characters"),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

type JobApplicationModalProps = {
  job: JobListing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JobApplicationModal({
  job,
  open,
  onOpenChange,
}: JobApplicationModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      linkedinUrl: "",
      githubUrl: "",
      personalNote: "",
    },
  });

  const onSubmit = async (values: ApplicationFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/job-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobListingId: job.id,
          linkedinUrl: values.linkedinUrl || null,
          githubUrl: values.githubUrl || null,
          personalNote: values.personalNote,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit application");
      }

      toast({
        title: "Application Submitted!",
        description: `Your application for ${job.title} has been sent successfully.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Application error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            Fill in your details to apply for this position at {job.companyName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </FormControl>
                  <FormDescription>Optional: Your LinkedIn profile</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="githubUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Profile URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://github.com/yourusername"
                    />
                  </FormControl>
                  <FormDescription>Optional: Your GitHub profile</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter / Personal Note *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us why you're a great fit for this role..."
                      rows={6}
                    />
                  </FormControl>
                  <FormDescription>
                    Write a brief note about your interest and qualifications (10-500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner /> : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
