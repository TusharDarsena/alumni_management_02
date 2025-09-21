import { Bell, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UserInfo {
  name: string;
  email: string;
  avatarUrl?: string;
  notificationCount?: number;
}

interface HeaderProps {
  title?: string;
  user: UserInfo;
  welcomeMessage?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export default function Header({ title, user, welcomeMessage, onNavigate, className }: HeaderProps) {
  return (
    <header className={cn("w-full bg-white border-b", className)}>
      <div className="mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex flex-col">
          {title && <h1 className="text-base font-semibold text-slate-800">{title}</h1>}
          <span className="text-sm text-slate-500">{welcomeMessage ?? `Welcome, ${user.name}!`}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="relative" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {user.notificationCount ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-primary text-primary-foreground text-[10px] px-1">
                {user.notificationCount}
              </span>
            ) : null}
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-slate-600" />
              )}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium leading-none">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <Button variant="outline" onClick={() => onNavigate?.("/profile")}>
              Profile
            </Button>
            <Button onClick={() => onNavigate?.("/settings")}>Settings</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
