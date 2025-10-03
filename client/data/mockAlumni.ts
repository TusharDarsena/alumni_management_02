import linkedinData from "../../linkedin_data.json";

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// Helper to extract batch year from education string
function extractBatch(education: string): string | null {
  const match = education.match(/(\d{4})\s*-\s*(\d{4})/);
  return match ? match[2] : null; // End year as batch
}

// Helper to parse education string into object
function parseEducation(educationStr: string) {
  if (!educationStr || educationStr === "") return [];
  const parts = educationStr.split(",");
  const institute = parts[0]?.trim() || null;
  const degreeFull = parts[1]?.trim() || "";
  const branch = parts[2]?.trim() || "";
  const years = parts[3]?.trim() || "";
  const yearMatch = years.match(/(\d{4})\s*-\s*(\d{4})/);
  const startYear = yearMatch ? parseInt(yearMatch[1]) : null;
  const endYear = yearMatch ? parseInt(yearMatch[2]) : null;
  const degree = degreeFull.replace("(BTech)", "").trim() + (branch ? ` in ${branch}` : "");
  return [{ degree, institute, startYear, endYear }];
}

// Helper to parse experience
function parseExperience(title: string, company: string, location: string, experienceStr: string) {
  if (!title || !company) return [];
  const role = title;
  const expYears = experienceStr.match(/(\d+\.?\d*)\+?\s*years?/);
  const startYear = expYears ? new Date().getFullYear() - Math.floor(parseFloat(expYears[1])) : null;
  return [{
    role,
    company,
    location: location || null,
    startYear,
    endYear: "Present"
  }];
}

// Helper to categorize skills
function categorizeSkills(skillsStr: string) {
  if (!skillsStr || skillsStr === "Not specified" || skillsStr === "(not explicitly listed)") return { technical: [], core: [] };
  const skills = skillsStr.split(",").map(s => s.trim());
  const technical = [];
  const core = [];
  skills.forEach(skill => {
    if (["React", "TypeScript", "Node.js", "Python", "Coding", "Problem-solving"].includes(skill)) {
      technical.push(skill);
    } else {
      core.push(skill);
    }
  });
  return { technical, core };
}

// Transform linkedin_data.json to new schema
const transformedAlumni = linkedinData
  .filter(entry => entry["LinkedIn URL"]) // Filter out empty entries
  .map(entry => ({
    name: entry.Title || "Unknown",
    email: null,
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&auto=format&fit=crop&q=60", // Default avatar
    linkedinUrl: entry["LinkedIn URL"] || null,
    location: entry.Location || null,
    education: parseEducation(entry.Education),
    experience: parseExperience(entry.Title, entry.Company, entry.Location, entry.Experience),
    skills: categorizeSkills(entry.Skills),
    graduationYear: extractBatch(entry.Education) ? parseInt(extractBatch(entry.Education)) : null,
    batch: extractBatch(entry.Education) || null,
    username: slugify(entry.Title || "Unknown"),
  }));

export const alumniList = transformedAlumni;
