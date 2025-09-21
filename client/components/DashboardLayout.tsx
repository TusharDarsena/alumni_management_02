import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Bell, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileSettingsModal, { type ModalInitialTab } from "@/components/ProfileSettingsModal";

export interface UserSummary {
  name: string;
  email?: string;
  avatarUrl?: string;
  notificationCount?: number;
  mobile?: string;
  location?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate?: (path: string) => void;
  user: UserSummary;
  fullWidth?: boolean;
}

export default function DashboardLayout({ children, activePage, onNavigate, user, fullWidth = false }: DashboardLayoutProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<ModalInitialTab>("profile");

  function handleOpenProfile() {
    setModalInitialTab("profile");
    setIsModalOpen(true);
  }
  function handleOpenSettings() {
    setModalInitialTab("settings");
    setIsModalOpen(true);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 ml-[275px] flex flex-col bg-white min-h-screen">
        {/* TopBar */}
        <div className="sticky top-0 z-20 bg-white border-b">
          <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
            <div className="text-lg font-semibold text-slate-800">{activePage}</div>
            <div className="flex items-center gap-4 relative">
              <button
                aria-label="Notifications"
                className="relative p-2 rounded-md hover:bg-slate-50"
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Bell className="h-5 w-5 text-slate-600" />
                {user.notificationCount ? (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                ) : null}
              </button>

              {notifOpen && (
                <div className="absolute right-14 mt-2 w-80 rounded-md border bg-white shadow-lg">
                  <div className="p-3 text-sm font-medium border-b">Notifications</div>
                  <div className="max-h-56 overflow-auto">
                    <div className="p-3 text-sm text-slate-600">No new notifications</div>
                  </div>
                </div>
              )}

              <div className="relative">
                <button
                  className="flex items-center gap-3 rounded-md p-1 hover:bg-slate-50"
                  onClick={() => setProfileOpen((v) => !v)}
                >
                  <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" /> : <UserIcon className="h-4 w-4 text-slate-600" />}
                  </div>
                  <div className="hidden sm:block text-sm text-slate-700">{user.name}</div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-lg">
                    <button
                      onClick={() => {
                        handleOpenProfile();
                        setProfileOpen(false);
                        onNavigate?.("/profile");
                      }}
                      className={cn("w-full text-left px-3 py-2 text-sm hover:bg-slate-50")}
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        handleOpenSettings();
                        setProfileOpen(false);
                        onNavigate?.("/settings");
                      }}
                      className={cn("w-full text-left px-3 py-2 text-sm hover:bg-slate-50")}
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setNotifOpen((v) => !v);
                        setProfileOpen(false);
                      }}
                      className={cn("w-full text-left px-3 py-2 text-sm hover:bg-slate-50")}
                    >
                      Notification
                    </button>
                    <button
                      onClick={() => {
                        onNavigate?.("/logout");
                        setProfileOpen(false);
                      }}
                      className={cn("w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-slate-50")}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">👋</span>
            <span className="text-[#0C1E33] text-xl font-normal">Welcome, {user.name}!</span>
          </div>
          <div className="h-px bg-[#CED8E5] mb-6" />
        </div>

        {/* Content area */}
        <div className={fullWidth ? "flex-1 overflow-auto px-6 pb-6" : "flex-1 overflow-auto px-6 pb-6 mx-auto max-w-7xl"}>{children}</div>

        <ProfileSettingsModal isOpen={isModalOpen} initialTab={modalInitialTab} onClose={() => setIsModalOpen(false)} user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl, mobile: user.mobile, location: user.location }} />
      </div>
    </div>
  );
}
