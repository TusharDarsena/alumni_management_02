import alumniData from "./alumnidata/aishwarya_maurya.json";

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// Transform new alumni data schema to the expected schema
const transformedAlumni = alumniData
  .filter(entry => entry.url) // Filter out entries without URL
  .map(entry => ({
    name: entry.name || "Unknown",
    email: null,
    imageUrl: entry.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&auto=format&fit=crop&q=60",
    linkedinUrl: entry.url || null,
    location: entry.location || null,
    education: entry.education.map(edu => ({
      degree: edu.degree + (edu.field ? ` in ${edu.field}` : ""),
      institute: edu.title,
      startYear: parseInt(edu.start_year),
      endYear: parseInt(edu.end_year)
    })),
    experience: entry.experience.map(exp => ({
      role: exp.title,
      company: exp.company,
      location: exp.location,
      startYear: exp.start_date ? parseInt(exp.start_date.split(' ')[1]) : null,
      endYear: exp.end_date === "Present" ? null : (exp.end_date ? parseInt(exp.end_date.split(' ')[1]) : null)
    })),
    skills: { technical: [], core: [] }, // No skills data in new schema
    graduationYear: entry.education.length > 0 ? parseInt(entry.education[0].end_year) : null,
    batch: entry.education.length > 0 ? entry.education[0].end_year : null,
    username: slugify(entry.name || "Unknown"),
  }));

export const alumniList = transformedAlumni;
