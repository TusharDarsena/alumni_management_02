import express from "express";
import AlumniProfile from "../models/AlumniProfile.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to extract batch year from education string
function extractBatch(education) {
  const match = education.match(/(\d{4})\s*-\s*(\d{4})/);
  return match ? match[2] : null; // End year as batch
}

// Helper to extract branch from education
function extractBranch(educationStr) {
  if (educationStr.includes("Computer Science")) return "CSE";
  if (educationStr.includes("Electronics")) return "ECE";
  if (educationStr.includes("Data Science")) return "DS";
  return "CSE"; // Default
}

// Helper to parse education string into object
function parseEducation(educationStr) {
  if (!educationStr || educationStr === "") return [];
  // Example: "IIIT-Naya Raipur, Bachelor of Technology (BTech), Electronics and Communications Engineering, 2017-2021"
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
function parseExperience(title, company, location, experienceStr) {
  if (!title || !company) return [];
  // Assume current role is the title
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
function categorizeSkills(skillsStr) {
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

// POST /import - Import alumni data from alumni_data(jsons) directory
router.post("/import", async (req, res) => {
  try {
    const alumniDataDir = path.join(__dirname, "../../client/data/alumnidata");
    const files = fs.readdirSync(alumniDataDir).filter(file => file.endsWith('.json'));
    const jsonData = files.flatMap(file => {
      const filePath = path.join(alumniDataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error(`Error parsing JSON file ${file}:`, e);
        return [];
      }
    });

    // Filter out empty entries (e.g., where LinkedIn URL is empty)
    const validEntries = jsonData.filter(entry => entry.url);

    // Transform to match schema
    const transformedData = validEntries.map(entry => ({
      name: entry.name || "Unknown",
      email: null,
      imageUrl: entry.avatar || null,
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
      skills: { technical: [], core: [] }, // No skills in new data
      graduationYear: entry.education.length > 0 ? parseInt(entry.education[0].end_year) : null,
      batch: entry.education.length > 0 ? entry.education[0].end_year : null,
      branch: entry.education.length > 0 && entry.education[0].field === "Computer Science" ? "CSE" : "CSE", // Default to CSE
    }));

    // Insert into MongoDB
    const inserted = await AlumniProfile.insertMany(transformedData);
    res.json({ success: true, count: inserted.length, message: "Alumni profiles imported successfully" });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET / - Get all alumni profiles (for confirmation)
router.get("/", async (req, res) => {
  try {
    const profiles = await AlumniProfile.find({});
    res.json({ success: true, count: profiles.length, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
