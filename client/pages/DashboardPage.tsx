
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardStatsGrid, { type DashboardStats } from "@/components/DashboardStatsGrid";
import { useAuth } from "@/hooks/useClerkAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [stats] = useState<DashboardStats>({
    alumniConnections: 500,
    favorite: 200,
    messages: 12,
    opportunities: 6,
  });

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const user = {
    name: authUser?.username || "User",
    email: authUser?.email,
    mobile: authUser?.phone,
    location: authUser?.location,
  };

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

        {/* Quick Actions or Recent Activity could go here */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Job Postings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => navigate("/job-opportunities")}>
                    <div>
                      <h4 className="font-medium text-slate-900">Senior Software Engineer</h4>
                      <p className="text-sm text-slate-500">Google • Bangalore</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
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
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">Alumni Name</h4>
                      <p className="text-sm text-slate-500">Batch of 2020 • SDE at Amazon</p>
                    </div>
                    <Button size="sm" variant="outline">Connect</Button>
                  </div>
                ))}
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
