import React from "react";
import { Heart, ArrowRight } from "lucide-react";
import { extractBatch, extractBranch, extractCurrentCompany } from "@shared/alumniUtils";

export interface AlumniItem {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  url?: string;
  location?: string;
  education?: Array<{
    title?: string;
    field?: string;
    start_year?: string;
    end_year?: string;
  }>;
  experience?: Array<{
    title?: string;
    company?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
  }>;
  position?: string;
  about?: string;
  graduationYear?: string;
  batch?: string;
  branch?: string;
  current_company?: string | {
    name?: string;
    title?: string;
    location?: string;
  };
}

interface AlumniCardProps {
  alumnus: AlumniItem;
  isFavourite?: boolean;
  onViewProfile?: (id: string) => void;
  onToggleFavourite?: (id: string) => void;
  onClick?: (id: string) => void;
}

export default function AlumniCard({ alumnus, isFavourite = false, onViewProfile, onToggleFavourite, onClick }: AlumniCardProps) {
  const batch = alumnus.batch || extractBatch(alumnus.education);
  const branch = alumnus.branch || extractBranch(alumnus.education);
  const currentCompanyName = extractCurrentCompany(alumnus.current_company, alumnus.experience);

  // Get current role/title
  const currentRole = alumnus.position || alumnus.experience?.[0]?.title;

  const handleView = () => {
    onViewProfile?.(alumnus.id);
    onClick?.(alumnus.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavourite?.(alumnus.id);
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="group relative bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={handleView}
    >
      {/* Ghost heart button - top right */}
      <button
        onClick={handleToggle}
        aria-label="Toggle favourite"
        className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full transition-all duration-150 ${isFavourite
          ? "text-red-500 bg-red-500/10"
          : "text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10"
          }`}
      >
        <Heart className={`h-4 w-4 ${isFavourite ? "fill-current" : ""}`} />
      </button>

      <div className="p-6">
        {/* Avatar + Name/Role block */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="h-24 w-24 rounded-full bg-muted overflow-hidden ring-2 ring-border/30">
              {alumnus.avatar ? (
                <img
                  src={alumnus.avatar}
                  alt={alumnus.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">
                    {getInitials(alumnus.name || "NA")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name + Role */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-semibold text-foreground text-base leading-tight truncate group-hover:text-primary transition-colors">
              {alumnus.name || "Name not available"}
            </h3>
            {(currentRole || currentCompanyName) && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {currentRole && currentRole !== "N/A" ? currentRole : ""}
                {currentRole && currentCompanyName && currentCompanyName !== "N/A" ? " · " : ""}
                {currentCompanyName && currentCompanyName !== "N/A" ? currentCompanyName : ""}
              </p>
            )}
          </div>
        </div>

        {/* Pill badges row */}
        <div className="flex flex-wrap gap-2 mb-4">
          {batch && batch !== "N/A" && batch !== "" && (
            <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
              {batch}
            </span>
          )}
          {branch && branch !== "N/A" && branch !== "" && (
            <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-teal-500/10 text-teal-700 dark:text-teal-400">
              {branch}
            </span>
          )}
          {currentCompanyName && currentCompanyName !== "N/A" && currentCompanyName !== "" && (
            <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
              {currentCompanyName}
            </span>
          )}
        </div>

        {/* View Profile link - left aligned, subtle */}
        <button
          onClick={handleView}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View Profile
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
