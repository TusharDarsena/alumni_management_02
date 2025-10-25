import React from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";

import { JOB_LISTING_EXPERIENCE_LEVELS, JOB_LISTING_TYPES } from "../constants/schema";
import { JobListingFilterValues } from "../hooks/useJobListingFilterForm";

function JobListingFilterForm({ form }: { form: UseFormReturn<JobListingFilterValues> }) {
  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="minimumSalary" render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Salary</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  min={0}
                  value={isNaN(field.value as any) ? "" : (field.value as any)}
                  onChange={(e) => field.onChange((e.target as HTMLInputElement).valueAsNumber)}
                />
              </FormControl>
            </FormItem>
          )} />

          <JobSelectFormField control={form.control} name="type" label="Job Type" options={JOB_LISTING_TYPES as any} />

          <JobSelectFormField control={form.control} name="experienceLevel" label="Experience Level" options={JOB_LISTING_EXPERIENCE_LEVELS as any} />

          <div className="flex items-end justify-end">
            <Button onClick={() => form.reset()}>Reset</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

type JobSelectFormFieldProps<T> = {
  label: string;
  control: any;
  name: any;
  options: readonly T[];
};

function JobSelectFormField<T>({ label, control, name, options }: JobSelectFormFieldProps<T>) {
  return (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <Select onValueChange={(val) => field.onChange(val)} value={field.value}>
          <FormControl>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="any">Any</SelectItem>
              {options.map((option: any) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </FormItem>
    )} />
  );
}

export default JobListingFilterForm;
