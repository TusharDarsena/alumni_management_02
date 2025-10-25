import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/utils/formatters"
import { cn } from "@/utils/shadcnUtils"
import { Banknote, CalendarDays, GraduationCap } from "lucide-react"
import { ReactNode } from "react"
import { JobListing } from "../constants/types"

type JobListingCardProps = {
  className?: string
  job: JobListing
  headerDetails?: ReactNode
  footerBtns?: ReactNode
}

const JobListingCard = ({
  className,
  job,
  headerDetails,
  footerBtns,
}: JobListingCardProps) => {
  return (
    <Card
      className={cn(
        "h-full flex flex-col cursor-pointer hover:scale-[1.02] hover:border-slate-400 border-slate-300 dark:border-slate-700 dark:hover:border-slate-400",
        className
      )}
      key={job.id}
    >
      <CardHeader>
        <div className="flex gap-4 justify-between">
          <div>
            <CardTitle className="text-lg flex justify-between">
              {job.title}
            </CardTitle>
            <CardDescription className="flex flex-col">
              <span>{job.companyName}</span>
              <span>{job.location}</span>
            </CardDescription>
          </div>
          {headerDetails}
        </div>

        <div className="flex gap-1 justify-start flex-wrap">
          <Badge variant="secondary" className="flex gap-1 whitespace-nowrap">
            <Banknote className="w-4 h-4"></Banknote>
            {formatCurrency(job.salary)}
          </Badge>
          <Badge variant="secondary" className="flex gap-1 whitespace-nowrap">
            <CalendarDays className="w-4 h-4"></CalendarDays>
            {job.type}
          </Badge>
          <Badge variant="secondary" className="flex gap-1 whitespace-nowrap">
            <GraduationCap className="w-4 h-4"></GraduationCap>
            {job.experienceLevel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow">{job.shortDescription}</CardContent>
      <CardFooter className="flex justify-end gap-2 items-stretch">
        {footerBtns}
      </CardFooter>
    </Card>
  )
}

export default JobListingCard
