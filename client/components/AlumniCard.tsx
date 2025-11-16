import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  // compatibility with older usage
  onClick?: (id: string) => void;
}

export default function AlumniCard({ alumnus, isFavourite = false, onViewProfile, onToggleFavourite, onClick }: AlumniCardProps) {
  // Extract batch, branch, and company from education/experience arrays
  const batch = alumnus.batch || extractBatch(alumnus.education);
  const branch = alumnus.branch || extractBranch(alumnus.education);
  const currentCompanyName = extractCurrentCompany(alumnus.current_company, alumnus.experience);

  const handleView = () => {
    onViewProfile?.(alumnus.id);
    onClick?.(alumnus.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavourite?.(alumnus.id);
  };

  // Build subtitle with batch, branch, and current company
  const subtitleParts: string[] = [];
  
  if (batch && batch !== "N/A" && batch !== "") {
    subtitleParts.push(`Batch: ${batch}`);
  }
  
  if (branch && branch !== "N/A" && branch !== "") {
    subtitleParts.push(`Branch: ${branch}`);
  }
  
  if (currentCompanyName && currentCompanyName !== "N/A" && currentCompanyName !== "") {
    subtitleParts.push(`${currentCompanyName}`);
  }
  
  const subtitle = subtitleParts.length > 0 
    ? subtitleParts.join(" | ") 
    : "Information not available";

  return (
    <Card className="rounded-lg overflow-hidden hover:shadow-xl transition-shadow cursor-default">
      
      <CardContent className="pt-6 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-white p-0.5 overflow-hidden border-2 border-white">
          {alumnus.avatar ? (
            <img src={alumnus.avatar} alt={alumnus.name} className="h-full w-full object-cover rounded-full" />
          ) : (
            <div className="h-full w-full bg-slate-200 rounded-full flex items-center justify-center text-gray-500">
              <span>No Image</span>
            </div>
          )}
        </div>
        <div className="mt-3 font-semibold text-slate-800">{alumnus.name || "Name not available"}</div>
        <div className="text-sm text-slate-500">{subtitle}</div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <Button size="sm" variant="default" onClick={handleView} className="bg-[#3B82F6] text-white hover:bg-[#2563EB]">
            View Profile
          </Button>
          <button onClick={handleToggle} aria-label="Toggle favourite" className="p-2">
            <Heart className={isFavourite ? "h-5 w-5 text-red-600" : "h-5 w-5 text-slate-500"} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
