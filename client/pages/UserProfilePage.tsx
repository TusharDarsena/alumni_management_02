import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AlumnusDetail {
  username: string;
  name: string;
  coverImageUrl?: string;
  profilePictureUrl?: string;
  bio?: string;
  graduationYear?: string;
  major?: string;
  company?: string;
  jobTitle?: string;
  email?: string;
  skills?: string[];
  experience?: { company: string; title: string; from: string; to?: string }[];
}

interface Props {
  alumnus: AlumnusDetail;
}

export default function UserProfilePage({ alumnus }: Props) {
  return (
    <DashboardLayout activePage="Profile" onNavigate={() => {}} user={{ name: alumnus.name, avatarUrl: alumnus.profilePictureUrl }}>
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="h-44 bg-slate-200 relative">
          {alumnus.coverImageUrl ? <img src={alumnus.coverImageUrl} alt={alumnus.name} className="h-full w-full object-cover" /> : null}
          <div className="absolute left-6 -bottom-10 flex items-center gap-4">
            <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white bg-white">
              {alumnus.profilePictureUrl ? <img src={alumnus.profilePictureUrl} alt={alumnus.name} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-slate-800">{alumnus.name}</div>
              <div className="text-sm text-slate-500">{alumnus.jobTitle} at {alumnus.company}</div>
            </div>
            <div className="ml-4">
              <Button className="ml-6 bg-[#3B82F6] text-white hover:bg-[#2563EB]">Connect</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{alumnus.bio}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <div>Graduation Year: {alumnus.graduationYear}</div>
              <div>Major: {alumnus.major}</div>
              <div>Company: {alumnus.company}</div>
              <div>Job Title: {alumnus.jobTitle}</div>
              <div>Contact: {alumnus.email}</div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {alumnus.skills?.map((s) => (
                <span key={s} className="px-3 py-1 rounded-full bg-white border text-slate-700">{s}</span>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alumnus.experience?.map((ex) => (
                  <div key={ex.company} className="border-l-2 pl-3">
                    <div className="font-medium">{ex.title} — {ex.company}</div>
                    <div className="text-sm text-slate-500">{ex.from} — {ex.to ?? "Present"}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
