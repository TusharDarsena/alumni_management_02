
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardStatsGrid, { type DashboardStats } from "@/components/DashboardStatsGrid";
import { useAuth } from "@/context/AuthContext";

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
      <div className="p-6">
        <DashboardStatsGrid stats={stats} />
      </div>
    </DashboardLayout>
  );
}
