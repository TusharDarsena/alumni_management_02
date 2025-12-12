import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardStatsGrid, { type DashboardStats } from "@/components/DashboardStatsGrid";
import { useAuth } from "@/hooks/useClerkAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Briefcase, MapPin } from "lucide-react";
import { getPublishedListings } from "@/features/job-listing/services/jobs";

// Types for data
interface JobListing {
  id: string;
  title: string;
  companyName: string;
  location: string;
  type: string;
  experienceLevel: string;
}

interface Alumni {
  id: string;
  name: string;
  avatar?: string;
  position?: string;
  current_company?: string;
  batch?: string;
  branch?: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { favorites } = useFavorites();

  // Stats state with initial values
  const [stats, setStats] = useState<DashboardStats>({
    totalAlumni: 0,
    favorite: 0,
    messages: 0,
    opportunities: 0,
  });

  // State for job listings and alumni
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [alumniLoading, setAlumniLoading] = useState(true);

  // Fetch dashboard stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats((prev) => ({
            ...prev,
            totalAlumni: data.totalAlumni || 0,
            messages: data.messagesCount || 0,
            opportunities: data.acceptedJobsCount || 0,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };
    fetchStats();
  }, []);

  // Update favorites count whenever favorites list changes
  useEffect(() => {
    setStats((prev) => ({
      ...prev,
      favorite: favorites.length,
    }));
  }, [favorites]);

  // Fetch job listings
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const listings = await getPublishedListings();
        setJobs(listings.slice(0, 3)); // Get latest 3 jobs
      } catch (error) {
        console.error("Failed to fetch job listings:", error);
      } finally {
        setJobsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Fetch alumni recommendations
  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const response = await fetch("/api/alumni?limit=3");
        const result = await response.json();
        if (result.data) {
          setAlumni(result.data.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to fetch alumni:", error);
      } finally {
        setAlumniLoading(false);
      }
    };
    fetchAlumni();
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const user = {
    name: authUser?.username || "User",
    email: authUser?.email,
    mobile: authUser?.phone,
    location: authUser?.location,
  };

  // Get initials from name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Loading skeleton for job listings
  const JobSkeleton = () => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-40 bg-slate-200 rounded"></div>
        <div className="h-3 w-28 bg-slate-200 rounded"></div>
      </div>
      <div className="w-4 h-4 bg-slate-200 rounded"></div>
    </div>
  );

  // Loading skeleton for alumni
  const AlumniSkeleton = () => (
    <div className="flex items-center gap-4 p-3 rounded-lg animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-200"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
        <div className="h-3 w-40 bg-slate-200 rounded"></div>
      </div>
      <div className="w-16 h-8 bg-slate-200 rounded"></div>
    </div>
  );

  return (
    <DashboardLayout activePage="Dashboard" onNavigate={handleNavigation} user={user}>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-blue-600 p-8 md:p-12 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-blue-100 text-lg mb-8">
              Here's what's happening in your alumni network today. You have {stats.messages} new messages and {stats.opportunities} new job opportunities.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" onClick={() => navigate("/search-alumni")}>
                Find Alumni
              </Button>
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" onClick={() => navigate("/user-profile")}>
                View Profile
              </Button>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Overview
          </h2>
          <DashboardStatsGrid stats={stats} />
        </div>

        {/* Recent Job Postings & Recommended Connections */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Recent Job Postings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobsLoading ? (
                  <>
                    <JobSkeleton />
                    <JobSkeleton />
                    <JobSkeleton />
                  </>
                ) : jobs.length > 0 ? (
                  jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                      onClick={() => navigate("/job-opportunities")}
                    >
                      <div>
                        <h4 className="font-medium text-slate-900 group-hover:text-primary transition-colors">
                          {job.title}
                        </h4>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          {job.companyName} <span className="text-slate-300">•</span>{" "}
                          <MapPin className="w-3 h-3 inline" /> {job.location}
                        </p>
                        <span className="text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {job.type}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>No job postings available</p>
                  </div>
                )}
              </div>
              <Button variant="link" className="w-full mt-4" onClick={() => navigate("/job-opportunities")}>
                View all jobs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alumniLoading ? (
                  <>
                    <AlumniSkeleton />
                    <AlumniSkeleton />
                    <AlumniSkeleton />
                  </>
                ) : alumni.length > 0 ? (
                  alumni.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/alumni/${person.id}`)}
                    >
                      {person.avatar ? (
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="w-10 h-10 rounded-full object-cover bg-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                          {getInitials(person.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">{person.name}</h4>
                        <p className="text-sm text-slate-500 truncate">
                          {person.position || "Alumni"}
                          {person.current_company && ` at ${person.current_company}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/alumni/${person.id}`);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No alumni recommendations available</p>
                  </div>
                )}
              </div>
              <Button variant="link" className="w-full mt-4" onClick={() => navigate("/search-alumni")}>
                Find more alumni
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
