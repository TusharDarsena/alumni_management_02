import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Star, MessageSquare, Briefcase } from "lucide-react";

export interface DashboardStats {
  totalAlumni: number;
  favorite: number;
  messages?: number;
  opportunities?: number;
}

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export default function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  const items = [
    { label: "Total Alumni", value: stats.totalAlumni, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Favorites", value: stats.favorite, icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Messages", value: stats.messages ?? 0, icon: MessageSquare, color: "text-accent", bg: "bg-accent/10" },
    { label: "Accepted Jobs", value: stats.opportunities ?? 0, icon: Briefcase, color: "text-neon-pink", bg: "bg-neon-pink/10" },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <Card
          key={it.label}
          className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:glow-sm"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{it.label}</CardTitle>
            <div className={`p-2 rounded-lg ${it.bg}`}>
              <it.icon className={`h-4 w-4 ${it.color}`} />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-display font-bold text-foreground">{it.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total count</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

