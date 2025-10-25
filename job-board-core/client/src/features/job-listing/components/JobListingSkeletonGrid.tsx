import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Banknote, CalendarDays, GraduationCap } from "lucide-react"
import { Fragment } from "react"

const JobListingSkeletonGrid = ({ amount }: { amount: number }) => {
  return (
    <div className="flex flex-col sm:grid gap-4 grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
      {Array.from({ length: amount }).map((_, idx) => (
        <Fragment key={idx}>
          <JobListingSkeletonCard />
        </Fragment>
      ))}
    </div>
  )
}

const JobListingSkeletonCard = () => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex gap-1 flex-col">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="flex gap-1 justify-start flex-wrap">
          <Badge
            variant="secondary"
            className="flex gap-1 whitespace-nowrap animate-pulse"
          >
            <Banknote className="w-4 h-4"></Banknote>
            <Skeleton className="w-8"></Skeleton>
          </Badge>
          <Badge
            variant="secondary"
            className="flex gap-1 whitespace-nowrap animate-pulse"
          >
            <CalendarDays className="w-4 h-4"></CalendarDays>
            <Skeleton className="w-8"></Skeleton>
          </Badge>
          <Badge
            variant="secondary"
            className="flex gap-1 whitespace-nowrap animate-pulse"
          >
            <GraduationCap className="w-4 h-4"></GraduationCap>
            <Skeleton className="w-8"></Skeleton>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col gap-1">
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="flex justify-end gap-2 items-stretch">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
  )
}

export { JobListingSkeletonGrid }
