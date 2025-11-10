import React, { useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { jobListingFormSchema } from "../constants/schema";
import {
  JOB_LISTING_EXPERIENCE_LEVELS,
  JOB_LISTING_TYPES,
  ELIGIBLE_BRANCHES,
  ELIGIBLE_ROLES,
} from "../constants/schema";
import JobListingGrid from "./JobListingGrid";
import JobListingCard from "./JobListingCard";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";

type JobListingFormValues = z.infer<typeof jobListingFormSchema>;

const DEFAULT_VALUES: JobListingFormValues = {
  applyUrl: "",
  companyName: "",
  description: "",
  experienceLevel: "Mid-Level",
  location: "",
  salary: NaN,
  shortDescription: "",
  title: "",
  type: "Full Time",
  eligibleBranches: ["All Branches"],
  eligibleRoles: ["Open for all"],
};

type JobListingFromProps = {
  onSubmit: (values: JobListingFormValues) => void;
  initialJobListing?: JobListingFormValues;
  onFormChange?: () => void;
};

export default function JobListingForm({
  onSubmit,
  initialJobListing = DEFAULT_VALUES,
  onFormChange,
}: JobListingFromProps) {
  const form = useForm<JobListingFormValues>({
    resolver: zodResolver(jobListingFormSchema),
    defaultValues: initialJobListing,
  });

  const [showPreview, setShowPreview] = useState(false);
  const jobListingValues = form.watch();

  // Track form changes
  React.useEffect(() => {
    const subscription = form.watch(() => {
      if (onFormChange) {
        onFormChange();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onFormChange]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-5">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applyUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application URL</FormLabel>
                  <FormControl>
                    <Input type="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <JobSelectFormField
              control={form.control}
              name="type"
              label="Type"
              options={JOB_LISTING_TYPES as any}
            />

            <JobSelectFormField
              control={form.control}
              name="experienceLevel"
              label="Experience Level"
              options={JOB_LISTING_EXPERIENCE_LEVELS as any}
            />

            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          (e.target as HTMLInputElement).valueAsNumber,
                        )
                      }
                      value={
                        isNaN(field.value as any) ? "" : (field.value as any)
                      }
                    />
                  </FormControl>
                  <FormDescription>In USD</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eligibleBranches"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligible Branches</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={ELIGIBLE_BRANCHES.map((branch) => ({
                        label: branch,
                        value: branch,
                      }))}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Select eligible branches"
                    />
                  </FormControl>
                  <FormDescription>Select applicable branches</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eligibleRoles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligible Roles</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={ELIGIBLE_ROLES.map((role) => ({
                        label: role,
                        value: role,
                      }))}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Select eligible roles"
                    />
                  </FormControl>
                  <FormDescription>Select applicable roles</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 lg:col-span-3">
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormDescription>Max 200 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>Full Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormDescription>Supports full Markdown</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              onClick={() => setShowPreview((state) => !state)}
              variant="outline"
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
            <Button type="submit">
              {form.formState.isSubmitting ? <LoadingSpinner /> : "Save"}
            </Button>
          </div>
        </form>
      </Form>

      {showPreview && (
        <JobListingGrid>
          <JobListingCard
            job={jobListingValues as any}
            footerBtns={<div>Preview</div>}
          />
        </JobListingGrid>
      )}
    </>
  );
}

type JobSelectFormFieldProps<T> = {
  label: string;
  control: any;
  name: any;
  options: readonly T[];
};

function JobSelectFormField<T>({
  label,
  control,
  name,
  options,
}: JobSelectFormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={(val) => field.onChange(val)}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                {options.map((option: any) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
