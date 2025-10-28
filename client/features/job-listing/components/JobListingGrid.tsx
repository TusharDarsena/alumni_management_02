import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type JobListingGridProps = ComponentProps<"div"> & { children?: React.ReactNode };

export default function JobListingGrid({ className, children, ...props }: JobListingGridProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-col sm:grid gap-4 grid-cols-[repeat(auto-fill,minmax(400px,1fr))]",
        className
      )}
    >
      {children}
    </div>
  );
}
