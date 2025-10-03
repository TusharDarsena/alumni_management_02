import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown } from "lucide-react";
import { alumniList } from "@/data/mockAlumni";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserInfo } from "@/components/Header";
import AlumniCard from "@/components/AlumniCard";
import { useFavorites } from "@/hooks/useFavorites";

interface AlumniFilters {
  searchTerm: string;
  batch?: string;
  degree?: string;
  branch?: string;
}

interface AlumniItem {
  username: string;
  name: string;
  avatarUrl?: string;
  graduationYear?: string;
  major?: string;
  company?: string;
  email?: string;
}

export default function SearchAlumniPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AlumniFilters>({
    searchTerm: "",
    batch: "",
    degree: "",
    branch: ""
  });
  const [filteredAlumni, setFilteredAlumni] = useState<AlumniItem[]>(alumniList as any);
  const [batchOpen, setBatchOpen] = useState(false);
  const [degreeOpen, setDegreeOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();

  const [user] = useState<UserInfo>({
    name: "Merna",
    email: "merna@example.com",
    avatarUrl: undefined,
    notificationCount: 3,
  });

  useEffect(() => {
    const term = filters.searchTerm?.toLowerCase().trim() ?? "";
    const res = (alumniList as any).filter((a: AlumniItem) => {
      const matchName = term ? a.name.toLowerCase().includes(term) : true;
      const matchYear = filters.batch ? a.graduationYear === filters.batch : true;
      const matchMajor = filters.degree ? a.major === filters.degree : true;
      const matchBranch = filters.branch ? a.company === filters.branch : true;
      return matchName && matchYear && matchMajor && matchBranch;
    });
    setFilteredAlumni(res);
  }, [filters]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleViewProfile = (username: string) => {
    navigate(`/alumni/${username}`);
  };

  return (
    <DashboardLayout activePage="Search Alumni" onNavigate={handleNavigation} user={user}>
      {/* Search and Filters */}
      <div className="flex items-center gap-12 mb-12">
        {/* Search Bar */}
        <div className="relative w-[406px]">
          <div className="flex items-center gap-2 bg-black/10 rounded-full px-4 py-3">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search Alumni"
              className="bg-transparent outline-none text-gray-600 placeholder-gray-500 flex-1"
              value={filters.searchTerm}
              onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
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
            <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-xl z-10">
              {["2016", "2017", "2018", "2019"].map(year => (
                <div
                  key={year}
                  className="px-3 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setFilters(f => ({ ...f, batch: year }));
                    setBatchOpen(false);
                  }}
                >
                  {year}
                </div>
              ))}
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
            <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-xl z-10">
              {["B.Tech", "M.Tech", "P.H.D"].map(degree => (
                <div
                  key={degree}
                  className="px-3 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setFilters(f => ({ ...f, degree }));
                    setDegreeOpen(false);
                  }}
                >
                  {degree}
                </div>
              ))}
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
            <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-xl z-10">
              {["C.S.E", "D.SA.I", "E.C.E"].map(branch => (
                <div
                  key={branch}
                  className="px-3 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setFilters(f => ({ ...f, branch }));
                    setBranchOpen(false);
                  }}
                >
                  {branch}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alumni Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredAlumni.slice(0, 24).map((alumni) => (
          <AlumniCard
            key={alumni.username}
            alumnus={{ username: alumni.username, name: alumni.name, profilePictureUrl: alumni.avatarUrl, graduationYear: alumni.graduationYear, major: alumni.major, company: alumni.company }}
            isFavourite={isFavorite(alumni.username)}
            onViewProfile={handleViewProfile}
            onToggleFavourite={() => toggleFavorite(alumni.username)}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}
