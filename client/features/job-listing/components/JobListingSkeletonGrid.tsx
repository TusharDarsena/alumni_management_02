import { Fragment } from "react";

const JobListingSkeletonCard = () => {
  return <div className="h-48 bg-gray-200 animate-pulse rounded" />;
};

export function JobListingSkeletonGrid({ amount = 6 }: { amount?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: amount }).map((_, idx) => (
        <Fragment key={idx}>
          <JobListingSkeletonCard />
        </Fragment>
      ))}
    </div>
  );
}

export default JobListingSkeletonGrid;
