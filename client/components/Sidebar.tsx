import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Search, Shield, Users, Briefcase, Settings, Bell, GraduationCap, HelpCircle } from "lucide-react";

interface SidebarProps {
  className?: string;
}

const academicLinks = [
  { to: "/search-alumni", label: "Search Alumni", icon: Search },
  { to: "/search-favourites", label: "Favorites", icon: Users },
  { to: "/job-opportunities", label: "Job Opportunities", icon: Briefcase },
];

const adminLinks = [
  { to: "/admin", label: "Admin Controls", icon: Shield },
];

const settingsLinks = [
  { to: "/account-settings", label: "Account Settings", icon: Settings },
  { to: "/notification-preferences", label: "Notifications", icon: Bell },
];

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
          isActive
            ? "bg-primary/20 text-white"
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            "p-1.5 rounded-lg transition-colors",
            isActive ? "bg-primary text-white" : "bg-slate-800 group-hover:bg-primary/20"
          )}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{label}</span>
          {isActive && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ className }: SidebarProps) {
  return (
    <aside className={cn(
      "h-screen w-[280px] bg-slate-900 border-r border-slate-800 flex flex-col",
      className
    )}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-display font-semibold text-lg block leading-tight">IIITNR</span>
          <span className="text-slate-500 text-xs">Alumni Management</span>
        </div>
      </div>

      <div className="h-px bg-slate-800 mx-4" />

      {/* Navigation */}
      <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <NavItem to="/dashboard" label="Dashboard" icon={LayoutDashboard} />

        {/* Academic Section */}
        <div className="pt-6">
          <div className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2 px-4">
            Academic
          </div>
          <div className="space-y-1">
            {academicLinks.map(({ to, label, icon }) => (
              <NavItem key={to} to={to} label={label} icon={icon} />
            ))}
          </div>
        </div>

        {/* Admin Section */}
        <div className="pt-6">
          <div className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2 px-4">
            Admin
          </div>
          <div className="space-y-1">
            {adminLinks.map(({ to, label, icon }) => (
              <NavItem key={to} to={to} label={label} icon={icon} />
            ))}
          </div>
        </div>

        {/* Settings Section */}
        <div className="pt-6">
          <div className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2 px-4">
            Settings
          </div>
          <div className="space-y-1">
            {settingsLinks.map(({ to, label, icon }) => (
              <NavItem key={to} to={to} label={label} icon={icon} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-accent" />
            <p className="text-xs text-slate-400">Need Help?</p>
          </div>
          <p className="text-sm font-medium text-white">Contact Support</p>
        </div>
      </div>
    </aside>
  );
}


