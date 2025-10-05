import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import AlumniCard from "@/components/AlumniCard";
import { Input } from "@/components/ui/input";
import { useFavorites } from "@/hooks/useFavorites";

interface Props {
  favouriteAlumni?: any[];
}

export default function SearchFavouritesPage({ favouriteAlumni = [] }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { isFavorite, toggleFavorite } = useFavorites();

  const list = favouriteAlumni as any;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a: any) => a.name.toLowerCase().includes(q));
  }, [query, list]);

  const handleView = (username: string) => {
    navigate(`/alumni/${username}`);
  };

  return (
    <DashboardLayout activePage="My Favourites" onNavigate={() => {}} user={{ name: "Merna" }}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">My Favourites</h2>
      </div>

      <div className="mb-6 max-w-lg">
        <Input placeholder="Search favourites by name..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((al: any) => (
          <AlumniCard key={al.username} alumnus={{ id: al.username, name: al.name, avatar: al.avatarUrl, graduationYear: al.graduationYear, batch: al.graduationYear }} isFavourite={isFavorite(al.username)} onViewProfile={(id) => handleView(id)} onToggleFavourite={(id) => toggleFavorite(id)} />
        ))}
      </div>
    </DashboardLayout>
  );
}
