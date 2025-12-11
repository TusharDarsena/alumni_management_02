import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/shadcnUtils";
import { Banknote, CalendarDays, GraduationCap, MapPin, Building2 } from "lucide-react";
import { JobListing } from "../constants/types";

type JobListingCardProps = {
  className?: string;
  job: JobListing;
  headerDetails?: React.ReactNode;
  footerBtns?: React.ReactNode;
};

const JobListingCard = ({ className, job, headerDetails, footerBtns }: JobListingCardProps) => {
  return (
    <Card
      className={cn(
        "group h-full flex flex-col cursor-pointer transition-all duration-300",
        "border-border/50 hover:border-primary/50 hover:glow-sm",
        "bg-card hover:bg-card/80",
        className
      )}
      key={job.id}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />

      <CardHeader className="relative">
        <div className="flex gap-4 justify-between">
          <div>
            <CardTitle className="text-lg font-display font-semibold text-foreground group-hover:text-primary transition-colors">
              {job.title}
            </CardTitle>
            <CardDescription className="flex flex-col gap-1 mt-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="w-3.5 h-3.5" />
                {job.companyName}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
            </CardDescription>
          </div>
          {headerDetails}
        </div>

        <div className="flex gap-2 justify-start flex-wrap mt-4">
          <Badge className="bg-accent/15 text-accent border-accent/30 hover:bg-accent/20 flex gap-1.5">
            <Banknote className="w-3.5 h-3.5" />
            {formatCurrency(job.salary)}
          </Badge>
          <Badge className="bg-neon-pink/15 text-neon-pink border-neon-pink/30 hover:bg-neon-pink/20 flex gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {job.type}
          </Badge>
          <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 flex gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            {job.experienceLevel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow relative">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {job.shortDescription}
        </p>
      </CardContent>

      <CardFooter className="relative flex justify-end gap-2 items-stretch pt-4 border-t border-border/50">
        {footerBtns}
      </CardFooter>
    </Card>
  );
};

export default JobListingCard;

