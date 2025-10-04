import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserInfo } from "@/components/Header";
import AlumniCard from "@/components/AlumniCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AlumniFilters {
  searchTerm: string;
  batch?: string;
  degree?: string;
  branch?: string;
}

export default function SearchAlumniPage() {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [filters, setFilters] = useState<AlumniFilters>({
    searchTerm: "",
    batch: "",
    degree: "",
    branch: "",
  });

  const [batchOpen, setBatchOpen] = useState(false);
  const [degreeOpen, setDegreeOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);

  const [user] = useState<UserInfo>({
    name: "Merna",
    email: "merna@example.com",
    avatarUrl: undefined,
    notificationCount: 3,
  });

  const fetchList = async ({ queryKey }: any) => {
    const [_key, params] = queryKey;
    const qs = new URLSearchParams();
    qs.set("page", String(params.page || 1));
    qs.set("limit", String(params.limit || 24));
    if (params.search) qs.set("search", params.search);
    if (params.branch) qs.set("branch", params.branch);
    if (params.degree) qs.set("degree", params.degree);
    if (params.batch) qs.set("batch", params.batch);

    const res = await fetch(`/api/alumni?${qs.toString()}`, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    return res.json();
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["alumniList", { page: 1, limit: 24, search: filters.searchTerm, branch: filters.branch, degree: filters.degree, batch: filters.batch }],
    queryFn: fetchList,
    keepPreviousData: true,
    staleTime: 60_000, // 1 minute
    cacheTime: 1000 * 60 * 60 * 4, // 4 hours
    refetchOnWindowFocus: false,
  });

  const options = data?.filters || { branches: [], degrees: [], entryYears: [], locations: [] };
  const alumni = data?.data || [];

  useEffect(() => {
    // when filters change, refetch is triggered by queryKey change
  }, [filters]);

  const handleViewProfile = (username: string) => {
    navigate(`/alumni/${username}`);
  };

  return (
    <DashboardLayout activePage="Search Alumni" onNavigate={() => {}} user={user}>
      {/* Search and Filters */}
      <div className="flex items-center gap-12 mb-12">
        <div className="relative w-[406px]">
          <div className="flex items-center gap-2 bg-black/10 rounded-full px-4 py-3">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search Alumni"
              className="bg-transparent outline-none text-gray-600 placeholder-gray-500 flex-1"
              value={filters.searchTerm}
              onChange={(e) => setFilters((f) => ({ ...f, searchTerm: e.target.value }))}
            />
          </div>
        </div>

        {/* Entry Batch Filter */}
        <div className="relative w-[180px]">
          <div
            className="flex items-center justify-between px-3 py-3 border border-[#9D9D9D] rounded-lg bg-white cursor-pointer"
            onClick={() => setBatchOpen(!batchOpen)}
          >
            <span className="text-black">{filters.batch || "Entry Batch"}</span>
            <ChevronDown className="w-6 h-6" />
          </div>
          {batchOpen && (
            <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-xl z-10 max-h-64 overflow-auto">
              {options.entryYears.length === 0 && !isLoading ? (
                <div className="px-3 py-2 text-sm text-slate-500">No entry years</div>
              ) : isLoading ? (
                <div className="p-3"><Skeleton className="h-4 w-1/2" /></div>
              ) : (
                options.entryYears.map((year: string) => (
                  <div
                    key={year}
                    className="px-3 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setFilters((f) => ({ ...f, batch: year }));
                      setBatchOpen(false);
                    }}
                  >
                    {year}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Degree Filter */}
        <div className="relative w-[180px]">
          <div
            className="flex items-center justify-between px-3 py-3 border border-[#9D9D9D] rounded-lg bg-white cursor-pointer"
            onClick={() => setDegreeOpen(!degreeOpen)}
          >
            <span className="text-black">{filters.degree || "Degree"}</span>
            <ChevronDown className="w-6 h-6" />
          </div>
          {degreeOpen && (
            <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-xl z-10 max-h-64 overflow-auto">
              {options.degrees.length === 0 && !isLoading ? (
                <div className="px-3 py-2 text-sm text-slate-500">No degrees</div>
              ) : isLoading ? (
                <div className="p-3"><Skeleton className="h-4 w-1/2" /></div>
              ) : (
                options.degrees.map((degree: string) => (
                  <div
                    key={degree}
                    className="px-3 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setFilters((f) => ({ ...f, degree }));
                      setDegreeOpen(false);
                    }}
                  >
                    {degree}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Branch Filter */}
        <div className="relative w-[180px]">
          <div
            className="flex items-center justify-between px-3 py-3 border border-[#9D9D9D] rounded-lg bg-white cursor-pointer"
            onClick={() => setBranchOpen(!branchOpen)}
          >
            <span className="text-black">{filters.branch || "Branch"}</span>
            <ChevronDown className="w-6 h-6" />
          </div>
          {branchOpen && (
            <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-xl z-10 max-h-64 overflow-auto">
              {options.branches.length === 0 && !isLoading ? (
                <div className="px-3 py-2 text-sm text-slate-500">No branches</div>
              ) : isLoading ? (
                <div className="p-3"><Skeleton className="h-4 w-1/2" /></div>
              ) : (
                options.branches.map((branch: string) => (
                  <div
                    key={branch}
                    className="px-3 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setFilters((f) => ({ ...f, branch }));
                      setBranchOpen(false);
                    }}
                  >
                    {branch}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alumni Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading && Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-4">
            <CardContent>
              <Skeleton className="h-16 w-16 rounded-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}

        {!isLoading && alumni.length === 0 && (
          <div className="text-sm text-slate-500">No alumni found.</div>
        )}

        {!isLoading && alumni.map((alumniItem: any) => (
          <AlumniCard
            key={alumniItem.username}
            alumnus={{ username: alumniItem.username, name: alumniItem.name, profilePictureUrl: alumniItem.avatar, graduationYear: undefined, major: undefined, company: alumniItem.current_company }}
            isFavourite={isFavorite(alumniItem.username)}
            onViewProfile={() => handleViewProfile(alumniItem.username)}
            onToggleFavourite={() => toggleFavorite(alumniItem.username)}
          />
        ))}
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600">
          {(error as Error).message}
          <button className="ml-3 underline" onClick={() => refetch()}>Retry</button>
        </div>
      )}
    </DashboardLayout>
  );
}
