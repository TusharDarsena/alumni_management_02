import express from "express";
import AlumniProfile from "../models/AlumniProfile.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

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

// POST /import - Import alumni data from JSON body or alumni_data directory
router.post("/import", async (req, res) => {
  try {
    // Accept JSON array in request body if provided
    let incoming = null;
    if (req.body && Array.isArray(req.body) && req.body.length > 0) {
      incoming = req.body;
    } else {
      // Fallback: read from client/data/alumnidata directory
      const alumniDataDir = path.join(__dirname, "../../client/data/alumnidata");
      const files = fs.existsSync(alumniDataDir)
        ? fs.readdirSync(alumniDataDir).filter((file) => file.endsWith(".json"))
        : [];

      incoming = files.flatMap((file) => {
        const filePath = path.join(alumniDataDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        try {
          return JSON.parse(content);
        } catch (e) {
          console.error(`Error parsing JSON file ${file}:`, e);
          return [];
        }
      });
    }

    if (!incoming || incoming.length === 0) {
      return res.status(400).json({ success: false, message: "No alumni data provided" });
    }

    // Sanitization and normalization helper
    function normalize(entry) {
      const linkedin_id = String(entry.linkedin_id || entry.id || (entry.input && entry.input.url ? entry.input.url.split('/').pop() : '') || '').trim();
      const input_url = entry.input?.url || entry.input_url || entry.url || null;

      const doc = {
        id: entry.id || linkedin_id || undefined,
        name: entry.name || 'Unknown',
        first_name: entry.first_name || (entry.name ? String(entry.name).split(' ')[0] : undefined),
        last_name: entry.last_name || (entry.name ? String(entry.name).split(' ').slice(1).join(' ') : undefined),
        city: entry.city || undefined,
        country_code: entry.country_code || undefined,
        position: entry.position || undefined,
        about: entry.about || undefined,
        current_company: entry.current_company || (entry.current_company_name || entry.current_company_company_id ? { name: entry.current_company_name || null, company_id: entry.current_company_company_id || null, title: entry.current_company_title || null, location: entry.current_company_location || null } : undefined),
        experience: Array.isArray(entry.experience) ? entry.experience : undefined,
        education: Array.isArray(entry.education) ? entry.education : undefined,
        avatar: entry.avatar || undefined,
        followers: entry.followers ? Number(entry.followers) : undefined,
        connections: entry.connections ? Number(entry.connections) : undefined,
        current_company_company_id: entry.current_company_company_id || undefined,
        current_company_name: entry.current_company_name || undefined,
        location: entry.location || undefined,
        input_url,
        linkedin_id: linkedin_id || undefined,
        linkedin_num_id: entry.linkedin_num_id || undefined,
        banner_image: entry.banner_image || undefined,
        honors_and_awards: entry.honors_and_awards || undefined,
        similar_profiles: entry.similar_profiles || undefined,
        bio_links: entry.bio_links || undefined,
        timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
        input: entry.input || (input_url ? { url: input_url } : undefined),
      };

      // Remove undefined properties to avoid overwriting with undefined
      Object.keys(doc).forEach((k) => doc[k] === undefined && delete doc[k]);
      return doc;
    }

    // Prepare sanitized list, ensure we have a key to upsert on (linkedin_id)
    const sanitized = incoming.map(normalize).filter((d) => d.linkedin_id || d.id);
    if (sanitized.length === 0) {
      return res.status(400).json({ success: false, message: "No valid alumni entries with linkedin_id or id" });
    }

    // Batch bulkWrite with upsert on linkedin_id or id
    const batchSize = 500;
    let processed = 0;
    let summary = { total: sanitized.length, batches: 0, upserted: 0, modified: 0, matched: 0 };

    for (let i = 0; i < sanitized.length; i += batchSize) {
      const batch = sanitized.slice(i, i + batchSize);
      const ops = batch.map((doc) => {
        const filter = doc.linkedin_id ? { linkedin_id: doc.linkedin_id } : { id: doc.id };
        return {
          updateOne: {
            filter,
            update: { $set: doc },
            upsert: true,
          },
        };
      });

      const result = await AlumniProfile.bulkWrite(ops, { ordered: false });
      summary.batches += 1;
      summary.upserted += result.upsertedCount || 0;
      summary.modified += result.modifiedCount || 0;
      summary.matched += result.matchedCount || 0;
      processed += batch.length;
    }

    res.json({ success: true, message: "Import completed", summary, processed });
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

// GET /:id - Fetch a single alumni profile with lean projection and caching headers
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await AlumniProfile.findOne({ id })
      .select(
        "id name about avatar position current_company experience education updatedAt",
      )
      .lean();

    if (!doc) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const payload = {
      id: doc.id,
      name: doc.name,
      about: doc.about || null,
      avatar: doc.avatar || null,
      position: doc.position || doc.current_company?.title || null,
      current_company: doc.current_company || null,
      experience: Array.isArray(doc.experience) ? doc.experience : [],
      education: Array.isArray(doc.education) ? doc.education : [],
    };

    const etag = crypto
      .createHash("sha1")
      .update(JSON.stringify({ ...payload, updatedAt: doc.updatedAt }))
      .digest("base64");

    const clientTag = req.headers["if-none-match"];
    if (clientTag && clientTag === etag) {
      res.setHeader("ETag", etag);
      res.setHeader(
        "Cache-Control",
        "public, max-age=60, stale-while-revalidate=300",
      );
      res.status(304).end();
      return;
    }

    const cacheControl = "public, max-age=60, stale-while-revalidate=300";
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", cacheControl);
    if (doc.updatedAt) {
      res.setHeader("Last-Modified", new Date(doc.updatedAt).toUTCString());
    }

    res.json({
      success: true,
      data: payload,
      metadata: {
        etag,
        lastModified: doc.updatedAt || null,
        cacheControl,
      },
    });
  } catch (error) {
    console.error("Alumni detail error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
