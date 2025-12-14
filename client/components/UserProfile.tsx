import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  GraduationCap,
  Trophy,
  MapPin,
  Calendar,
  Linkedin,
  Heart,
  MessageCircle,
  UserPlus,
  Building2,
  Mail
} from "lucide-react";

export interface UserProfileData {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  url?: string;
  location?: string;
  education?: Array<{
    title?: string;
    degree?: string;
    field?: string;
    start_year?: string;
    end_year?: string;
    logoUrl?: string;
  }>;
  experience?: Array<{
    title?: string;
    company?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    duration?: string;
    company_logo_url?: string;
  }>;
  position?: string;
  about?: string;
  graduationYear?: string;
  batch?: string;
  branch?: string;
  honors_and_awards?: Array<{
    title?: string;
    issuer?: string;
    date?: string;
    description?: string;
  }> | null;
}

interface UserProfileProps {
  data: UserProfileData;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

function getBatchAndGraduationYear(education: UserProfileData["education"]): {
  batch?: string;
  graduationYear?: string;
  branch?: string;
  degree?: string;
} {
  if (!education) return {};
  const iiitEdu = education.find((edu) =>
    edu.title?.toLowerCase().includes("iiit") ||
    edu.title?.toLowerCase().includes("naya raipur")
  );
  if (!iiitEdu) {
    const first = education[0];
    return {
      batch: first?.start_year,
      graduationYear: first?.end_year,
      branch: first?.field,
      degree: first?.degree,
    };
  }
  return {
    batch: iiitEdu.start_year,
    graduationYear: iiitEdu.end_year,
    branch: iiitEdu.field,
    degree: iiitEdu.degree,
  };
}

// Pill component for branch, batch, degree
function InfoPill({ children, variant = "default" }: { children: React.ReactNode; variant?: "primary" | "accent" | "secondary" | "default" }) {
  const variants = {
    primary: "bg-primary/15 text-primary border-primary/30 dark:bg-primary/20",
    accent: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    secondary: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
    default: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 ${variants[variant]}`}>
      {children}
    </span>
  );
}

// Timeline item component with logo support
function TimelineItem({
  title,
  subtitle,
  meta,
  dateRange,
  logoUrl,
  fallbackIcon: FallbackIcon = Building2,
  isLast = false
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  dateRange?: string;
  logoUrl?: string;
  fallbackIcon?: React.ElementType;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-4 group">
      {/* Logo or fallback icon */}
      <div className="flex-shrink-0 pt-0.5">
        <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border/50 overflow-hidden flex items-center justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                // Hide broken image and show fallback
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <FallbackIcon className={`w-5 h-5 text-muted-foreground ${logoUrl ? 'hidden' : ''}`} />
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-5'}`}>
        <div className="flex flex-col gap-0.5">
          {/* Title row with date */}
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-semibold text-foreground text-sm leading-tight">{title}</h4>
            {dateRange && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap bg-muted/60 px-2 py-0.5 rounded border border-border/40 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                {dateRange}
              </span>
            )}
          </div>
          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-primary/80">{subtitle}</p>
          )}
          {/* Meta info */}
          {meta && (
            <p className="text-xs text-muted-foreground">{meta}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Section card with icon - improved styling
function SectionCard({
  icon: Icon,
  title,
  children,
  isEmpty = false
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}) {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border-border/60">
      {/* Header with icon */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 bg-gradient-to-r from-muted/50 to-transparent">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
      </div>
      {/* Content */}
      <CardContent className="p-5 pt-5">
        {isEmpty ? (
          <p className="text-sm text-muted-foreground italic py-2">No {title.toLowerCase()} details available.</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export default function UserProfile({ data, isFavorite, onToggleFavorite }: UserProfileProps) {
  const currentExperience = data.experience?.[0];
  const { batch, graduationYear, branch, degree } = getBatchAndGraduationYear(data.education);

  // Determine if we have honors/awards data
  const hasHonors = data.honors_and_awards && Array.isArray(data.honors_and_awards) && data.honors_and_awards.length > 0;

  return (
    <div className="w-full">
      {/* Two-column layout - adjusted proportions for better balance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column - Profile Card (spans 5 of 12 columns = ~42%) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <Card className="overflow-hidden shadow-lg border-border/60">
            {/* Gradient banner */}
            <div className="h-28 bg-gradient-to-br from-primary via-primary/80 to-accent relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAwLTQgMiAwIDQgMiA0czQtMiA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
            </div>

            <CardContent className="relative pt-0 px-6 pb-6">
              {/* Avatar - overlapping the banner */}
              <div className="relative -mt-16 mb-5">
                <div className="w-32 h-32 rounded-2xl border-4 border-card bg-muted overflow-hidden ring-4 ring-primary/20 shadow-xl">
                  {data.avatar ? (
                    <img
                      src={data.avatar}
                      alt={data.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary">
                        {data.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Headline */}
              <div className="space-y-2 mb-5">
                <h1 className="text-2xl font-bold text-foreground font-display">
                  {data.name || "Name not available"}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentExperience?.title && currentExperience.title !== "Not available"
                    ? currentExperience.title
                    : data.position || "Position not available"
                  }
                  {currentExperience?.company && currentExperience.company !== "Not available" && (
                    <span className="text-primary font-medium"> @ {currentExperience.company}</span>
                  )}
                </p>

                {/* Location */}
                {data.location && data.location !== "Not available" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                    <MapPin className="w-4 h-4 text-primary/70" />
                    <span>{data.location}</span>
                  </div>
                )}

                {/* Email */}
                {data.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                    <Mail className="w-4 h-4 text-emerald-500" />
                    <a
                      href={`mailto:${data.email}`}
                      className="text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      {data.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Pills for Branch, Batch, Degree */}
              <div className="flex flex-wrap gap-2 mb-6">
                {branch && branch !== "Not available" && (
                  <InfoPill variant="primary">{branch}</InfoPill>
                )}
                {batch && batch !== "Not available" && (
                  <InfoPill variant="accent">Batch {batch}</InfoPill>
                )}
                {graduationYear && graduationYear !== "Not available" && (
                  <InfoPill variant="secondary">Class of {graduationYear}</InfoPill>
                )}
                {degree && degree !== "Not available" && (
                  <InfoPill>{degree}</InfoPill>
                )}
              </div>

              {/* About section */}
              {data.about && data.about !== "Not available" && (
                <div className="mb-6 border-t border-border/60 pt-5">
                  <h4 className="text-sm font-semibold text-foreground mb-2.5">About</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {data.about}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                {data.url && (
                  <Button
                    variant="default"
                    className="w-full gap-2 h-11 shadow-md"
                    onClick={() => window.open(data.url, '_blank')}
                  >
                    <Linkedin className="w-4 h-4" />
                    View LinkedIn Profile
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="gap-2 h-10">
                    <UserPlus className="w-4 h-4" />
                    Connect
                  </Button>
                  <Button variant="outline" className="gap-2 h-10">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Button>
                </div>
                {onToggleFavorite && (
                  <Button
                    variant={isFavorite ? "destructive" : "secondary"}
                    className="w-full gap-2 h-10"
                    onClick={onToggleFavorite}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline Cards (spans 7 of 12 columns = ~58%) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Experience Section */}
          <SectionCard
            icon={Briefcase}
            title="Experience"
            isEmpty={!data.experience || data.experience.length === 0}
          >
            <div className="space-y-1">
              {data.experience?.map((exp, index) => (
                <TimelineItem
                  key={index}
                  title={exp.title && exp.title !== "Not available" ? exp.title : "Position not available"}
                  subtitle={exp.company && exp.company !== "Not available" ? exp.company : undefined}
                  meta={exp.location && exp.location !== "Not available" ? exp.location : undefined}
                  dateRange={
                    exp.start_date || exp.end_date
                      ? `${exp.start_date || "?"} - ${exp.end_date || "Present"}`
                      : undefined
                  }
                  logoUrl={exp.company_logo_url}
                  fallbackIcon={Building2}
                  isLast={index === (data.experience?.length ?? 0) - 1}
                />
              ))}
            </div>
          </SectionCard>

          {/* Education Section */}
          <SectionCard
            icon={GraduationCap}
            title="Education"
            isEmpty={!data.education || data.education.length === 0}
          >
            <div className="space-y-1">
              {data.education?.map((edu, index) => (
                <TimelineItem
                  key={index}
                  title={edu.title && edu.title !== "Not available" ? edu.title : "Institution not available"}
                  subtitle={edu.field && edu.field !== "Not available" ? edu.field : undefined}
                  meta={edu.degree && edu.degree !== "Not available" ? edu.degree : undefined}
                  dateRange={
                    edu.start_year || edu.end_year
                      ? `${edu.start_year || "?"} - ${edu.end_year || "?"}`
                      : undefined
                  }
                  logoUrl={edu.logoUrl}
                  fallbackIcon={GraduationCap}
                  isLast={index === (data.education?.length ?? 0) - 1}
                />
              ))}
            </div>
          </SectionCard>

          {/* Honors & Awards Section (only if data exists) */}
          {hasHonors && (
            <SectionCard
              icon={Trophy}
              title="Honors & Awards"
            >
              <div className="space-y-1">
                {data.honors_and_awards?.map((award, index) => (
                  <TimelineItem
                    key={index}
                    title={award.title || "Award"}
                    subtitle={award.issuer || undefined}
                    meta={award.description || undefined}
                    dateRange={award.date || undefined}
                    isLast={index === (data.honors_and_awards?.length ?? 0) - 1}
                  />
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
