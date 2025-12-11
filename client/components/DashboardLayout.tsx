import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { Bell, User as UserIcon, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileSettingsModal, {
  type ModalInitialTab,
  type ProfileUser,
} from "@/components/ProfileSettingsModal";
import { useAuth } from "@/hooks/useClerkAuth";
import { useTheme } from "@/context/ThemeContext";
import { UserButton } from "@clerk/clerk-react";

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

export default function DashboardLayout({
  children,
  activePage,
  onNavigate,
  user,
  fullWidth = false,
}: DashboardLayoutProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] =
    useState<ModalInitialTab>("profile");
  const { signOut, refresh } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Refs for click-outside detection
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleOpenProfile() {
    setModalInitialTab("profile");
    setIsModalOpen(true);
  }
  function handleOpenSettings() {
    setModalInitialTab("settings");
    setIsModalOpen(true);
  }

  const handleSaveProfile = async (updated: ProfileUser) => {
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: updated.name,
          email: updated.email,
          phone: updated.mobile,
          location: updated.location,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update profile");
      }
      // Refresh user data
      await refresh();
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col bg-background overflow-auto">
        {/* TopBar */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="text-lg font-display font-semibold text-foreground">
              {activePage}
            </div>
            <div className="flex items-center gap-4 relative">
              <div ref={notifRef} className="relative">
                <button
                  aria-label="Notifications"
                  className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setNotifOpen((v) => !v)}
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {user.notificationCount ? (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                  ) : null}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl">
                    <div className="p-3 text-sm font-medium border-b border-border text-foreground">
                      Notifications
                    </div>
                    <div className="max-h-56 overflow-auto">
                      <div className="p-3 text-sm text-muted-foreground">
                        No new notifications
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                aria-label="Toggle theme"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={toggleTheme}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-400" />
                )}
              </button>

              <div ref={profileRef} className="relative">
                <button
                  className="flex items-center gap-3 rounded-lg p-1 hover:bg-muted transition-colors"
                  onClick={() => setProfileOpen((v) => !v)}
                >
                  <div className="h-8 w-8 rounded-full bg-muted overflow-hidden ring-2 ring-primary/20">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="hidden sm:block text-sm font-medium text-foreground">
                    {user.name}
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                    <button
                      onClick={() => {
                        handleOpenProfile();
                        setProfileOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors",
                      )}
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        handleOpenSettings();
                        setProfileOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors",
                      )}
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setNotifOpen((v) => !v);
                        setProfileOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors",
                      )}
                    >
                      Notification
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={async () => {
                        setProfileOpen(false);
                        try {
                          await signOut();
                        } catch (e) {
                          // ignore
                        }
                        // hard redirect to avoid bfcache
                        window.location.replace("/");
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors",
                      )}
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
            <span className="text-2xl">👋</span>
            <span className="text-foreground text-xl font-display">
              Welcome, {user.name}!
            </span>
          </div>
          <div className="h-px bg-border mb-6" />
        </div>

        {/* Content area */}
        <div
          className={
            fullWidth
              ? "flex-1 px-6 pb-6"
              : "flex-1 px-6 pb-6"
          }
        >
          {children}
        </div>

        <ProfileSettingsModal
          isOpen={isModalOpen}
          initialTab={modalInitialTab}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProfile}
          user={{
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            mobile: user.mobile,
            location: user.location,
          }}
        />
      </div>
    </div>
  );
}
