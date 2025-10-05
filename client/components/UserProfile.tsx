import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface UserProfileData {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  url?: string;
  location?: string;
  education?: Array<{
    title?: string;
    field?: string;
    start_year?: string;
    end_year?: string;
  }>;
  experience?: Array<{
    title?: string;
    company?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
  }>;
  position?: string;
  about?: string;
  graduationYear?: string;
  batch?: string;
}

interface UserProfileProps {
  data: UserProfileData;
}

function getBatchAndGraduationYear(education: UserProfileData["education"]): { batch?: string; graduationYear?: string } {
  if (!education) return {};
  const iiitEdu = education.find((edu) => edu.title === "IIIT-Naya Raipur");
  if (!iiitEdu) return {};
  return {
    batch: iiitEdu.start_year,
    graduationYear: iiitEdu.end_year,
  };
}

export default function UserProfile({ data }: UserProfileProps) {
  const currentEducation = data.education?.[0];
  const currentExperience = data.experience?.[0];
  const { batch, graduationYear } = getBatchAndGraduationYear(data.education);

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-slate-200 overflow-hidden">
            {data.avatar ? (
              <img src={data.avatar} alt={data.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold">{data.name || "Not available"}</div>
            <div className="text-sm text-slate-600">
              {currentExperience?.title || "Not available"} at {currentExperience?.company || "Not available"}
            </div>
            <div className="text-sm text-slate-500">
              {currentEducation?.title || "Not available"} from {currentEducation?.field || "Not available"}
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
                <div className="font-semibold">{exp.title || "Not available"}</div>
                <div className="text-sm text-slate-600">{exp.company || "Not available"} • {exp.location || "Not available"}</div>
                <div className="text-sm text-slate-500">
                  {exp.start_date || "Not available"} - {exp.end_date || "Not available"}
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
                <div className="font-semibold">{edu.title || "Not available"}</div>
                <div className="text-sm text-slate-600">{edu.field || "Not available"}</div>
                <div className="text-sm text-slate-500">
                  {edu.start_year || "Not available"} - {edu.end_year || "Not available"}
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
                {data.position || "Not available"}
              </div>
            </div>
            <div>
              <div className="font-semibold">About</div>
              <div className="text-sm text-slate-600">
                {data.about || "Not available"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
