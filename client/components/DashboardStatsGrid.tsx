import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Star, MessageSquare, Briefcase } from "lucide-react";

export interface DashboardStats {
  alumniConnections: number;
  favorite: number;
  messages?: number;
  opportunities?: number;
}

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export default function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  const items = [
    { label: "Alumni Connections", value: stats.alumniConnections, icon: Users },
    { label: "Favorites", value: stats.favorite, icon: Star },
    { label: "Messages", value: stats.messages ?? 0, icon: MessageSquare },
    { label: "Opportunities", value: stats.opportunities ?? 0, icon: Briefcase },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{it.label}</CardTitle>
            <it.icon className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{it.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
