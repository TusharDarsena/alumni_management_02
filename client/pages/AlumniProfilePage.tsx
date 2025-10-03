import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import Header, { type UserInfo } from "@/components/Header";
import UserProfile, { type UserProfileData } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { alumniList } from "@/data/mockAlumni";
import { useFavorites } from "@/hooks/useFavorites";

export default function AlumniProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [user] = useState<UserInfo>({ name: "Merna", email: "merna@example.com" });
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  useEffect(() => {
    if (!username) return;
    const found = alumniList.find((a) => a.username === username);
    if (found) {
      const profileData: UserProfileData = {
        username: found.username,
        name: found.name,
        email: found.email,
        imageUrl: found.imageUrl,
        linkedinUrl: found.linkedinUrl,
        location: found.location,
        education: found.education,
        experience: found.experience,
        skills: found.skills,
        graduationYear: found.graduationYear,
        batch: found.batch,
      };
      setProfile(profileData);
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


      </div>
    </DashboardLayout>
  );
}
