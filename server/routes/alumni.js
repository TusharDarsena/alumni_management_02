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
  const degree =
    degreeFull.replace("(BTech)", "").trim() + (branch ? ` in ${branch}` : "");
  return [{ degree, institute, startYear, endYear }];
}

// Helper to parse experience
function parseExperience(title, company, location, experienceStr) {
  if (!title || !company) return [];
  // Assume current role is the title
  const role = title;
  const expYears = experienceStr.match(/(\d+\.?\d*)\+?\s*years?/);
  const startYear = expYears
    ? new Date().getFullYear() - Math.floor(parseFloat(expYears[1]))
    : null;
  return [
    {
      role,
      company,
      location: location || null,
      startYear,
      endYear: "Present",
    },
  ];
}

// Helper to categorize skills
function categorizeSkills(skillsStr) {
  if (
    !skillsStr ||
    skillsStr === "Not specified" ||
    skillsStr === "(not explicitly listed)"
  )
    return { technical: [], core: [] };
  const skills = skillsStr.split(",").map((s) => s.trim());
  const technical = [];
  const core = [];
  skills.forEach((skill) => {
    if (
      [
        "React",
        "TypeScript",
        "Node.js",
        "Python",
        "Coding",
        "Problem-solving",
      ].includes(skill)
    ) {
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
    const files = fs
      .readdirSync(alumniDataDir)
      .filter((file) => file.endsWith(".json"));
    const jsonData = files.flatMap((file) => {
      const filePath = path.join(alumniDataDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error(`Error parsing JSON file ${file}:`, e);
        return [];
      }
    });

    // Filter out empty entries (e.g., where LinkedIn URL is empty)
    const validEntries = jsonData.filter((entry) => entry.url);

    // Transform to match schema
    const transformedData = validEntries.map((entry) => ({
      name: entry.name || "Unknown",
      email: null,
      imageUrl: entry.avatar || null,
      linkedinUrl: entry.url || null,
      location: entry.location || null,
      education: entry.education.map((edu) => ({
        degree: edu.degree + (edu.field ? ` in ${edu.field}` : ""),
        institute: edu.title,
        startYear: parseInt(edu.start_year),
        endYear: parseInt(edu.end_year),
      })),
      experience: entry.experience.map((exp) => ({
        role: exp.title,
        company: exp.company,
        location: exp.location,
        startYear: exp.start_date
          ? parseInt(exp.start_date.split(" ")[1])
          : null,
        endYear:
          exp.end_date === "Present"
            ? null
            : exp.end_date
              ? parseInt(exp.end_date.split(" ")[1])
              : null,
      })),
      skills: { technical: [], core: [] }, // No skills in new data
      graduationYear:
        entry.education.length > 0
          ? parseInt(entry.education[0].end_year)
          : null,
      batch: entry.education.length > 0 ? entry.education[0].end_year : null,
      branch:
        entry.education.length > 0 &&
        entry.education[0].field === "Computer Science"
          ? "CSE"
          : "CSE", // Default to CSE
    }));

    // Insert into MongoDB
    const inserted = await AlumniProfile.insertMany(transformedData);
    res.json({
      success: true,
      count: inserted.length,
      message: "Alumni profiles imported successfully",
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET / - Search, filter and paginate alumni profiles
// Query params: search, branch, degree, batch, page, limit
router.get("/", async (req, res) => {
  try {
    const { search, branch, degree, batch } = req.query;
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "24", 10), 1);
    const skip = (page - 1) * limit;

    const pipeline = [];

    // Atlas Search stage (if search provided)
    if (search && String(search).trim() !== "") {
      pipeline.push({
        $search: {
          index: "default",
          compound: {
            should: [
              {
                autocomplete: {
                  query: String(search),
                  path: "name",
                  fuzzy: { maxEdits: 2 },
                },
              },
              {
                autocomplete: {
                  query: String(search),
                  path: "position",
                  fuzzy: { maxEdits: 2 },
                },
              },
              {
                autocomplete: {
                  query: String(search),
                  path: "current_company.name",
                  fuzzy: { maxEdits: 2 },
                },
              },
            ],
            minimumShouldMatch: 1,
          },
        },
      });
    }

    // Match filters (education fields are inside array)
    const match = {};
    if (branch) match["education.field"] = String(branch);
    if (degree) match["education.degree"] = String(degree);
    if (batch) match["education.start_year"] = String(batch);

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    // Facet for paginated data, total count and metadata
    pipeline.push({
      $facet: {
        data: [
          { $sort: { name: 1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              username: "$id",
              name: 1,
              avatar: "$avatar",
              position: 1,
              current_company: "$current_company.name",
              location: 1,
              education: 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
        metadata: [
          { $unwind: { path: "$education", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: null,
              branches: { $addToSet: "$education.field" },
              degrees: { $addToSet: "$education.degree" },
              batches: { $addToSet: "$education.start_year" },
            },
          },
          { $project: { _id: 0, branches: 1, degrees: 1, batches: 1 } },
        ],
      },
    });

    const results = await AlumniProfile.aggregate(pipeline).allowDiskUse(true);

    const data = (results[0].data || []).map((d) => ({
      username: d.username,
      name: d.name,
      avatar: d.avatar,
      position: d.position,
      current_company: d.current_company,
      location: d.location,
      education: d.education,
    }));

    const totalCount = results[0].totalCount[0]
      ? results[0].totalCount[0].count
      : 0;
    const totalPages = Math.ceil(totalCount / limit);

    const metadata = results[0].metadata[0] || {
      branches: [],
      degrees: [],
      batches: [],
    };

    res.json({
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalCount,
        limit,
      },
      metadata,
    });
  } catch (error) {
    console.error("Alumni search error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
