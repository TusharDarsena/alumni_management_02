import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import Header, { type UserInfo } from "@/components/Header";
import UserProfile, { type UserProfileData } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { alumniList } from "@/data/mockAlumni";

export default function AlumniProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [user] = useState<UserInfo>({ name: "Merna", email: "merna@example.com" });
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  useEffect(() => {
    if (!username) return;
    const found = alumniList.find((a) => a.username === username);
    if (found) {
      setProfile({
        username: found.username,
        name: found.name,
        avatarUrl: found.avatarUrl,
        degree: found.degree,
        branch: found.branch,
        batch: found.batch,
        currentCompany: found.company,
        bio: `${found.name} is an alumnus of IIIT Naya Raipur currently at ${found.company ?? "a leading company"}. Passionate about technology and community building.`,
      });
    } else {
      setProfile(null);
    }
  }, [username]);

  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <DashboardLayout activePage="Alumni Profile" onNavigate={(p) => console.log("nav", p)} user={user}>
      <div className="mt-6 space-y-6">
        {profile && (
          <div className="flex items-start justify-between gap-4">
            <UserProfile data={profile} />
            <div className="mt-4">
              <button
                className={`px-4 py-2 rounded-md ${isFavorite(profile!.username) ? 'bg-red-600 text-white' : 'bg-[#3B82F6] text-white'}`}
                onClick={() => toggleFavorite(profile!.username)}
              >
                {isFavorite(profile!.username) ? 'Remove Favourite' : 'Save as Favourite'}
              </button>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>Software Engineer at {profile?.currentCompany ?? "Company"} (2021 - Present)</p>
            <p>Intern at Tech Labs (2020 - 2021)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>{profile?.degree} in {profile?.branch}, IIIT Naya Raipur ({profile?.batch})</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {['React', 'TypeScript', 'Node.js', 'Data Structures', 'Communication'].map((s) => (
              <span key={s} className="px-3 py-1 rounded-full bg-white border text-slate-700">{s}</span>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
