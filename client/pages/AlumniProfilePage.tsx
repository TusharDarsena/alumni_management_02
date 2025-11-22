import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { type UserSummary } from "@/components/DashboardLayout"; // ✅ IMPORTED UserSummary
import UserProfile, { type UserProfileData } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/context/AuthContext"; // ✅ IMPORTED useAuth
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"; // ✅ IMPORTED LoadingSpinner

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

function HeaderSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2 w-full max-w-md">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </CardContent>
    </Card>
  );
}

function ListSectionSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AlumniProfilePage() {
  const { username } = useParams<{ username: string }>();
  // ✅ REMOVED hardcoded 'Merna' user
  const { user: authUser } = useAuth(); // ✅ ADDED auth hook
  const { isFavorite, toggleFavorite } = useFavorites();

  const query = useQuery({
    enabled: Boolean(username),
    queryKey: ["alumni", username],
    queryFn: () => fetchAlumniProfile(username as string),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      // Do not retry 404s
      // @ts-ignore
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
      url: d.input_url || undefined,
      location: d.current_company?.location || undefined,
      education: Array.isArray(d.education)
        ? d.education.map((e: any) => ({
            degree: e.degree ? (e.field ? `${e.degree} in ${e.field}` : e.degree) : undefined,
            title: e.title || undefined,
            field: e.field || undefined,
            start_year: e.start_year || undefined,
            end_year: e.end_year || undefined,
          }))
        : [],
      experience: Array.isArray(d.experience)
        ? d.experience.map((e: any) => ({
            title: e.title || undefined,
            company: e.company || d.current_company?.name || undefined,
            location: e.location || undefined,
            start_date: e.start_date || undefined,
            end_date: e.end_date || (e.end_date === "Present" ? ("Present" as any) : undefined),
          }))
        : [],
      graduationYear: undefined,
      batch: undefined,
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
      activePage="Alumni Profile" 
      onNavigate={(p) => console.log("nav", p)} 
      user={userForLayout} // ✅ PASSED correct user
    >
      <div className="mt-6 space-y-6">
        {query.isLoading && (
          <>
            <HeaderSkeleton />
            <ListSectionSkeleton title="Experience" />
            <ListSectionSkeleton title="Education" />
          </>
        )}

        {query.isError && (
          <Card>
            <CardHeader>
              <CardTitle>Problem loading profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-red-600">
                  {(query.error as Error)?.message || "Something went wrong"}
                </div>
                <Button onClick={() => query.refetch()}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {query.isSuccess && profile && (
          <div className="flex items-start justify-between gap-4">
            <UserProfile data={profile} />
            <div className="mt-4">
              <button
                className={`px-4 py-2 rounded-md ${isFavorite(profile.id) ? "bg-red-600 text-white" : "bg-[#3B82F6] text-white"}`}
                onClick={() => toggleFavorite(profile.id)}
              >
                {isFavorite(profile.id) ? "Remove Favourite" : "Save as Favourite"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}