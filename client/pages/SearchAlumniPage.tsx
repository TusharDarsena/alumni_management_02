import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserSummary } from "@/components/DashboardLayout";
import AlumniCard from "@/components/AlumniCard";
import { useFavorites } from "@/hooks/useFavorites";
import AlumniFilterBar from "@/components/AlumniFilterBar";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useClerkAuth";
import { SearchX } from "lucide-react";

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

  const { user: authUser } = useAuth();

  const safeSetFilters = (newFilters: AlumniFilters) => {
    const sanitizedSearchTerm =
      newFilters.searchTerm && newFilters.searchTerm !== "undefined"
        ? newFilters.searchTerm
        : "";
    setFilters({ ...newFilters, searchTerm: sanitizedSearchTerm });
  };

  const { isFavorite, toggleFavorite } = useFavorites();

  const { data, isLoading } = useQuery({
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

  const userForLayout: UserSummary = {
    name: authUser?.username || "User",
    email: authUser?.email,
    avatarUrl: authUser?.avatarUrl,
    notificationCount: authUser?.notificationCount,
    mobile: authUser?.phone,
    location: authUser?.location,
  };

  return (
    <DashboardLayout
      activePage="Search Alumni"
      onNavigate={handleNavigation}
      user={userForLayout}
    >
      {/* Page Header - Strong hierarchy */}
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Search Alumni</h1>
        {!isLoading && alumni.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total || alumni.length} alumni in the network
          </p>
        )}
      </div>

      {/* Compact Filter Bar */}
      <div className="mb-5">
        <AlumniFilterBar filters={filters} onFilterChange={safeSetFilters} />
      </div>

      {/* Results section with grey background */}
      <div className="-mx-6 px-6 py-5 bg-muted/30 min-h-[400px] rounded-t-xl">
        {/* Results count */}
        {!isLoading && alumni.length > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            Showing {Math.min(alumni.length, 24)} results
          </p>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border/50 p-4 animate-pulse">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="flex gap-1.5 mb-3">
                  <div className="h-4 bg-muted rounded w-10" />
                  <div className="h-4 bg-muted rounded w-12" />
                </div>
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && alumni.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <SearchX className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">No alumni found</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your filters
            </p>
          </div>
        )}

        {/* Alumni Cards Grid - tighter gap */}
        {!isLoading && alumni.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        )}
      </div>
    </DashboardLayout>
  );
}