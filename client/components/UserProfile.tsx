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
            ) : (
              <div className="h-full w-full bg-gray-300 flex items-center justify-center text-gray-500">
                <span>No Image</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold">{data.name || "Name not available"}</div>
            <div className="text-sm text-slate-600">
              {(currentExperience?.title && currentExperience.title !== "Not available" ? currentExperience.title : "Title not available")} at {(currentExperience?.company && currentExperience.company !== "Not available" ? currentExperience.company : "Company not available")}
            </div>
            <div className="text-sm text-slate-500">
              {(currentEducation?.title && currentEducation.title !== "Not available" ? currentEducation.title : "Institute not available")} from {(currentEducation?.field && currentEducation.field !== "Not available" ? currentEducation.field : "Field not available")}
            </div>
            <div className="text-sm text-slate-500">
              {data.location || "Location not available"}
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
                <div className="font-semibold">{exp.title && exp.title !== "Not available" ? exp.title : "Title not available"}</div>
                <div className="text-sm text-slate-600">{exp.company && exp.company !== "Not available" ? exp.company : "Company not available"} • {exp.location && exp.location !== "Not available" ? exp.location : "Location not available"}</div>
                <div className="text-sm text-slate-500">
                  {exp.start_date || "Start date not available"} - {exp.end_date || "End date not available"}
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
                <div className="font-semibold">{edu.title && edu.title !== "Not available" ? edu.title : "Institute not available"}</div>
                <div className="text-sm text-slate-600">{edu.field && edu.field !== "Not available" ? edu.field : "Field not available"}</div>
                <div className="text-sm text-slate-500">
                  {edu.start_year || "Start year not available"} - {edu.end_year || "End year not available"}
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
                {data.position && data.position !== "Not available" ? data.position : "Position not available"}
              </div>
            </div>
            <div>
              <div className="font-semibold">About</div>
              <div className="text-sm text-slate-600">
                {data.about && data.about !== "Not available" ? data.about : "About not available"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
