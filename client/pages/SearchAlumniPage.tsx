import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserSummary } from "@/components/DashboardLayout"; // ✅ IMPORTED UserSummary
import AlumniCard from "@/components/AlumniCard";
import { useFavorites } from "@/hooks/useFavorites";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import AlumniFilterBar from "@/components/AlumniFilterBar";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useClerkAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"; // ✅ IMPORTED LoadingSpinner

interface AlumniFilters {
  searchTerm: string;
  batch?: string;
  degree?: string;
  branch?: string;
}

export default function SearchAlumniPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AlumniFilters>({
    searchTerm: "",
    batch: "",
    degree: "",
    branch: "",
  });

  // ✅ REMOVED hardcoded user
  const { user: authUser } = useAuth(); // ✅ ADDED auth hook

  // Defensive setter to sanitize searchTerm
  const safeSetFilters = (newFilters: AlumniFilters) => {
    const sanitizedSearchTerm =
      newFilters.searchTerm && newFilters.searchTerm !== "undefined"
        ? newFilters.searchTerm
        : "";
    setFilters({ ...newFilters, searchTerm: sanitizedSearchTerm });
  };

  const { isFavorite, toggleFavorite } = useFavorites();

  const { data } = useQuery({
    queryKey: ["alumni", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.searchTerm) params.append("search", filters.searchTerm);
      if (filters.batch) params.append("batch", filters.batch);
      if (filters.degree) params.append("degree", filters.degree);
      if (filters.branch) params.append("branch", filters.branch);

      const response = await fetch(`/api/alumni?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch alumni");

      const result = await response.json();
      console.log("API result:", result);
      return result;
    },
  });

  const alumni = data?.data || [];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleViewProfile = (id: string) => {
    navigate(`/alumni/${id}`);
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
      activePage="Search Alumni"
      onNavigate={handleNavigation}
      user={userForLayout} // ✅ PASSED correct user
    >
      {/* Search and Filters */}
      <div className="mb-12">
        <AlumniFilterBar filters={filters} onFilterChange={safeSetFilters} />
      </div>

      {/* Alumni Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {alumni.slice(0, 24).map((alumnus: any) => (
          <AlumniCard
            key={alumnus.id}
            alumnus={alumnus}
            isFavourite={isFavorite(alumnus.id)}
            onViewProfile={handleViewProfile}
            onToggleFavourite={toggleFavorite}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}