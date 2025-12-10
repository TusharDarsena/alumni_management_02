import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserSummary } from "@/components/DashboardLayout"; // ✅ IMPORTED UserSummary
import AlumniCard from "@/components/AlumniCard";
import { Input } from "@/components/ui/input";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useClerkAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"; // ✅ IMPORTED LoadingSpinner

export default function SearchFavouritesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [favoriteAlumni, setFavoriteAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  
  const { user: authUser } = useAuth();

  // Fetch alumni data for favorites
  useEffect(() => {
    async function fetchFavoriteAlumni() {
      if (favorites.length === 0) {
        setFavoriteAlumni([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch all alumni that match the favorite IDs
        const promises = favorites.map(async (id) => {
          try {
            const response = await fetch(`/api/alumni/${id}`);
            if (!response.ok) return null;
            const result = await response.json();
            return result.success ? result.data : null;
          } catch (error) {
            console.error(`Failed to fetch alumni ${id}:`, error);
            return null;
          }
        });

        const results = await Promise.all(promises);
        const validAlumni = results.filter(Boolean);
        setFavoriteAlumni(validAlumni);
      } catch (error) {
        console.error("Error fetching favorite alumni:", error);
        setFavoriteAlumni([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFavoriteAlumni();
  }, [favorites]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favoriteAlumni;
    return favoriteAlumni.filter((a: any) => 
      a.name?.toLowerCase().includes(q) || 
      a.username?.toLowerCase().includes(q)
    );
  }, [query, favoriteAlumni]);

  const handleView = (username: string) => {
    navigate(`/alumni/${username}`);
  };

  // ✅ CREATED user object for layout
  const userForLayout: UserSummary = {
    name: authUser.username, // Mapped username to name
    email: authUser.email,
    avatarUrl: authUser.avatarUrl,
    notificationCount: authUser.notificationCount,
    mobile: authUser.phone,
    location: authUser.location,
  };

  return (
    <DashboardLayout 
      activePage="My Favourites" 
      onNavigate={() => {}} 
      user={userForLayout} // ✅ PASSED correct user
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold">My Favourites</h2>
      </div>

      <div className="mb-6 max-w-lg">
        <Input placeholder="Search favourites by name..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {favoriteAlumni.length === 0 
            ? "No favourites yet. Start adding alumni to your favourites from the Search Alumni page!"
            : "No results found for your search."
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((al: any) => (
            <AlumniCard 
              key={al.id || al.username} 
              alumnus={al}
              isFavourite={isFavorite(al.id || al.username)} 
              onViewProfile={(id) => handleView(id)} 
              onToggleFavourite={(id) => toggleFavorite(id)} 
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}