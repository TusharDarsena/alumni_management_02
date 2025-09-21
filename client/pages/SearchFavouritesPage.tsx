import React, { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AlumniCard, { type AlumniItem } from "@/components/AlumniCard";
import { Input } from "@/components/ui/input";

interface Props {
  favouriteAlumni?: AlumniItem[];
}

export default function SearchFavouritesPage({ favouriteAlumni = [] }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favouriteAlumni;
    return favouriteAlumni.filter((a) => a.name.toLowerCase().includes(q));
  }, [query, favouriteAlumni]);

  return (
    <DashboardLayout activePage="My Favourites" onNavigate={() => {}} user={{ name: "Merna" }}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">My Favourites</h2>
      </div>

      <div className="mb-6 max-w-lg">
        <Input placeholder="Search favourites by name..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((al) => (
          <AlumniCard key={al.username} alumnus={al} isFavourite onViewProfile={() => {}} onToggleFavourite={() => {}} />
        ))}
      </div>
    </DashboardLayout>
  );
}
