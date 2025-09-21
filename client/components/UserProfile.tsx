import { Card, CardContent } from "@/components/ui/card";

export interface UserProfileData {
  username: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  currentCompany?: string;
  degree?: string;
  branch?: string;
  batch?: string;
}

interface UserProfileProps {
  data: UserProfileData;
}

export default function UserProfile({ data }: UserProfileProps) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-slate-200 overflow-hidden">
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt={data.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="space-y-1">
          <div className="text-xl font-bold">{data.name}</div>
          <div className="text-sm text-slate-600">
            {[data.degree, data.branch, data.batch].filter(Boolean).join(" • ")}
          </div>
          {data.currentCompany && (
            <div className="text-sm text-slate-500">{data.currentCompany}</div>
          )}
          {data.bio && <p className="text-sm text-slate-600 max-w-2xl">{data.bio}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
