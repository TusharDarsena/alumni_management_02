import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { GraduationCap, LayoutDashboard, Search, Shield, Users, Briefcase, Settings, Bell, Book } from "lucide-react";

interface SidebarProps {
  className?: string;
}

const academicLinks = [
  { to: "/search-alumni", label: "Search Alumni", icon: Search },
  { to: "/search-favourites", label: "Favorite", icon: Users },
  { to: "/job-opportunities", label: "Job Opportunities", icon: Briefcase },
];

const adminLinks = [
  { to: "/admin", label: "Admin Controls", icon: Shield },
];

const settingsLinks = [
  { to: "/account-settings", label: "Account settings", icon: Settings },
  { to: "/notification-preferences", label: "Notification preferences", icon: Bell },
];

export default function Sidebar({ className }: SidebarProps) {
  return (
    <aside className={cn("h-screen w-[275px] bg-[#262626] flex flex-col", className)}>
      {/* Logo */}
      <div className="p-8 flex items-center gap-2">
        <Book className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Alumni Management</span>
      </div>

      <div className="h-px bg-white/20 mx-4" />

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 space-y-1">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-3 rounded cursor-pointer",
              isActive ? 'bg-white/10 border-l-4 border-white' : 'hover:bg-white/5'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5 text-white" />
          <span className="text-white text-sm font-medium">Dashboard</span>
        </NavLink>

        {/* Academic Section */}
        <div className="pt-6">
          <div className="text-white/60 text-xs font-medium mb-3 px-4">ACADEMIC</div>
          {academicLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded cursor-pointer",
                  isActive ? 'bg-white/10 border-l-4 border-white' : 'hover:bg-white/5'
                )
              }
            >
              <Icon className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Admin Section */}
        <div className="pt-6">
          <div className="text-white/60 text-xs font-medium mb-3 px-4">ADMIN</div>
          {adminLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded cursor-pointer",
                  isActive ? 'bg-white/10 border-l-4 border-white' : 'hover:bg-white/5'
                )
              }
            >
              <Icon className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Settings Section */}
        <div className="pt-6">
          <div className="text-white/60 text-xs font-medium mb-3 px-4">SETTINGS</div>
          {settingsLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded cursor-pointer",
                  isActive ? 'bg-white/10 border-l-4 border-white' : 'hover:bg-white/5'
                )
              }
            >
              <Icon className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
