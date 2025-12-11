import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserSummary } from "@/components/DashboardLayout";
import UserProfile, { type UserProfileData } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useClerkAuth";

async function fetchAlumniProfile(id: string) {
  const res = await fetch(`/api/alumni/${encodeURIComponent(id)}`, {
    headers: {
      "Accept": "application/json",
    },
    credentials: "include",
  });
  if (res.status === 404) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body?.message || "Profile not found");
    err.status = 404;
    throw err;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Request failed with ${res.status}`);
  }
  const json = await res.json();
  return json;
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left column skeleton */}
      <div className="w-full lg:w-[38%]">
        <Card>
          <div className="h-24 bg-muted animate-pulse" />
          <CardContent className="pt-0 px-6 pb-6">
            <div className="relative -mt-14 mb-4">
              <Skeleton className="w-28 h-28 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <div className="space-y-2 pt-4">
                <Skeleton className="h-10 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right column skeleton */}
      <div className="w-full lg:w-[62%] space-y-6">
        {["Experience", "Education"].map((title) => (
          <Card key={title}>
            <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-6 w-32" />
            </div>
            <CardContent className="p-5">
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-3 h-3 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AlumniProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: authUser } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const query = useQuery({
    enabled: Boolean(username),
    queryKey: ["alumni", username],
    queryFn: () => fetchAlumniProfile(username as string),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      // Do not retry 404s
      if ((error as any)?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const profile: UserProfileData | null = useMemo(() => {
    if (!query.data?.data) return null;
    const d = query.data.data as any;
    const mapped: UserProfileData = {
      id: d.id,
      name: d.name,
      email: undefined,
      avatar: d.avatar || undefined,
      url: d.input_url || d.url || undefined,
      location: d.current_company?.location || d.location || undefined,
      education: Array.isArray(d.education)
        ? d.education.map((e: any) => ({
          title: e.title || undefined,
          degree: e.degree || undefined,
          field: e.field || undefined,
          start_year: e.start_year || undefined,
          end_year: e.end_year || undefined,
          logoUrl: e.institute_logo_url || undefined,
        }))
        : [],
      experience: Array.isArray(d.experience)
        ? d.experience.map((e: any) => ({
          title: e.title || undefined,
          company: e.company || d.current_company?.name || undefined,
          location: e.location || undefined,
          start_date: e.start_date || undefined,
          end_date: e.end_date || (e.end_date === "Present" ? "Present" : undefined),
          duration: e.duration || undefined,
          company_logo_url: e.company_logo_url || undefined,
        }))
        : [],
      position: d.position || d.current_company?.title || undefined,
      about: d.about || undefined,
      graduationYear: d.graduationYear || undefined,
      batch: d.batch || undefined,
      branch: d.branch || undefined,
      honors_and_awards: d.honors_and_awards || undefined,
    };
    return mapped;
  }, [query.data]);


  useEffect(() => {
    if (query.isSuccess && query.data?.data) {
      const d = query.data.data as any;
      const titlePart = d.position || d.current_company?.title || (profile?.experience?.[0]?.title ?? "Alumni");
      const docTitle = `${d.name} - ${titlePart || "Alumni"} | Alumni Directory`;
      document.title = docTitle;
      const meta = document.querySelector('meta[name="description"]');
      const description = d.about || `${d.name} at ${d.current_company?.name || ""}`.trim();
      if (meta) {
        meta.setAttribute("content", description);
      } else {
        const m = document.createElement("meta");
        m.name = "description";
        m.content = description;
        document.head.appendChild(m);
      }
    }
  }, [query.isSuccess, query.data, profile]);

  const userForLayout: UserSummary = {
    name: authUser.username,
    email: authUser.email,
    avatarUrl: authUser.avatarUrl,
    notificationCount: authUser.notificationCount,
    mobile: authUser.phone,
    location: authUser.location,
  };

  return (
    <DashboardLayout
      activePage="Alumni Profile"
      onNavigate={(p) => console.log("nav", p)}
      user={userForLayout}
    >
      <div className="mt-6">
        {query.isLoading && <ProfileSkeleton />}

        {query.isError && (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-destructive">Problem loading profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {(query.error as Error)?.message || "Something went wrong while loading the profile."}
                </p>
                <Button onClick={() => query.refetch()} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {query.isSuccess && profile && (
          <UserProfile
            data={profile}
            isFavorite={isFavorite(profile.id)}
            onToggleFavorite={() => toggleFavorite(profile.id)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}