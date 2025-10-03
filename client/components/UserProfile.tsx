import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface UserProfileData {
  username: string;
  name: string;
  email?: string;
  imageUrl?: string;
  linkedinUrl?: string;
  location?: string;
  education?: Array<{
    degree?: string;
    institute?: string;
    startYear?: number;
    endYear?: number;
  }>;
  experience?: Array<{
    role?: string;
    company?: string;
    location?: string;
    startYear?: number;
    endYear?: string | number;
  }>;
  skills?: {
    technical: string[];
    core: string[];
  };
  graduationYear?: number;
  batch?: string;
}

interface UserProfileProps {
  data: UserProfileData;
}

export default function UserProfile({ data }: UserProfileProps) {
  const currentEducation = data.education?.[0];
  const currentExperience = data.experience?.[0];

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-slate-200 overflow-hidden">
            {data.imageUrl ? (
              <img src={data.imageUrl} alt={data.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold">{data.name || "Not available"}</div>
            <div className="text-sm text-slate-600">
              {currentExperience?.role || "Not available"} at {currentExperience?.company || "Not available"}
            </div>
            <div className="text-sm text-slate-500">
              {currentEducation?.degree || "Not available"} from {currentEducation?.institute || "Not available"}
            </div>
            <div className="text-sm text-slate-500">
              {data.location || "Not available"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader>
          <CardTitle>Experience</CardTitle>
        </CardHeader>
        <CardContent>
          {data.experience && data.experience.length > 0 ? (
            data.experience.map((exp, index) => (
              <div key={index} className="mb-4">
                <div className="font-semibold">{exp.role || "Not available"}</div>
                <div className="text-sm text-slate-600">{exp.company || "Not available"} • {exp.location || "Not available"}</div>
                <div className="text-sm text-slate-500">
                  {exp.startYear || "Not available"} - {exp.endYear || "Not available"}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">No experience details provided.</div>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle>Education</CardTitle>
        </CardHeader>
        <CardContent>
          {data.education && data.education.length > 0 ? (
            data.education.map((edu, index) => (
              <div key={index} className="mb-4">
                <div className="font-semibold">{edu.degree || "Not available"}</div>
                <div className="text-sm text-slate-600">{edu.institute || "Not available"}</div>
                <div className="text-sm text-slate-500">
                  {edu.startYear || "Not available"} - {edu.endYear || "Not available"}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">No education details provided.</div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <div className="font-semibold">Technical Skills</div>
              <div className="text-sm text-slate-600">
                {data.skills && data.skills.technical && data.skills.technical.length > 0 ? data.skills.technical.join(", ") : "Not available"}
              </div>
            </div>
            <div>
              <div className="font-semibold">Core Skills</div>
              <div className="text-sm text-slate-600">
                {data.skills && data.skills.core && data.skills.core.length > 0 ? data.skills.core.join(", ") : "Not available"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
