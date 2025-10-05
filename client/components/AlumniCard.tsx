import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

interface AlumniCardProps {
  alumnus: AlumniItem;
  isFavourite?: boolean;
  onViewProfile?: (id: string) => void;
  onToggleFavourite?: (id: string) => void;
  // compatibility with older usage
  onClick?: (id: string) => void;
}

function getBatchAndGraduationYear(education: AlumniItem["education"]): { batch?: string; graduationYear?: string } {
  if (!education) return {};
  const iiitEdu = education.find((edu) => edu.title === "IIIT-Naya Raipur");
  if (!iiitEdu) return {};
  return {
    batch: iiitEdu.start_year,
    graduationYear: iiitEdu.end_year,
  };
}

export default function AlumniCard({ alumnus, isFavourite = false, onViewProfile, onToggleFavourite, onClick }: AlumniCardProps) {
  const { batch, graduationYear } = getBatchAndGraduationYear(alumnus.education);

  const handleView = () => {
    onViewProfile?.(alumnus.id);
    onClick?.(alumnus.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavourite?.(alumnus.id);
  };

  const subtitle = `Batch: ${batch || "N/A"} | Graduation Year: ${graduationYear || "N/A"}`;

  return (
    <Card className="rounded-lg overflow-hidden hover:shadow-xl transition-shadow cursor-default">
      <div className="h-28 bg-slate-200 relative">
        {/* No cover image data, keep default bg */}
      </div>
      <CardContent className="pt-0 -mt-8 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-white p-0.5 overflow-hidden border-2 border-white">
          {alumnus.avatar ? (
            <img src={alumnus.avatar} alt={alumnus.name} className="h-full w-full object-cover rounded-full" />
          ) : (
            <div className="h-full w-full bg-slate-200 rounded-full" />
          )}
        </div>
        <div className="mt-3 font-semibold text-slate-800">{alumnus.name}</div>
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
