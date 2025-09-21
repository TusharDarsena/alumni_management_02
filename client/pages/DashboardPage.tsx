
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import Header, { type UserInfo } from "@/components/Header";
import DashboardStatsGrid, { type DashboardStats } from "@/components/DashboardStatsGrid";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user] = useState<UserInfo>({
    name: "Merna",
    email: "merna@example.com",
    avatarUrl: undefined,
    notificationCount: 3,
  });
  const [stats] = useState<DashboardStats>({
    alumniConnections: 500,
    favorite: 200,
    messages: 12,
    opportunities: 6,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<ModalInitialTab>("profile");

  const handleNavigation = (path: string) => {
    if (path === "/profile") {
      setModalInitialTab("profile");
      setIsModalOpen(true);
      return;
    }
    if (path === "/settings") {
      setModalInitialTab("settings");
      setIsModalOpen(true);
      return;
    }
    navigate(path);
  };

  return (
    <DashboardLayout activePage="Dashboard" onNavigate={handleNavigation} user={user}>
      <div className="p-6">
        <DashboardStatsGrid stats={stats} />
      </div>

    </DashboardLayout>
  );
}
