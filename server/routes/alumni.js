import express from "express";
import AlumniProfile from "../models/AlumniProfile.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { normalizeAlumniEntry, normalizeAlumniEntries } from "../utils/alumniNormalizer.js";
import { getCached, setCached } from "../utils/cacheManager.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /import - Import alumni data from JSON body or alumni_data directory
router.post("/import", async (req, res) => {
  try {
    // Accept JSON array in request body if provided
    let incoming = null;
    if (req.body && Array.isArray(req.body) && req.body.length > 0) {
      incoming = req.body;
    } else {
      // Fallback: read from client/data/alumnidata directory
      const alumniDataDir = path.join(
        __dirname,
        "../../client/data/alumnidata",
      );
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
      return res
        .status(400)
        .json({ success: false, message: "No alumni data provided" });
    }

    // Prepare sanitized list, ensure we have a key to upsert on (linkedin_id)
    const sanitized = normalizeAlumniEntries(incoming);
    if (sanitized.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid alumni entries with linkedin_id or id",
      });
    }

    // Batch bulkWrite with upsert on linkedin_id or id
    const batchSize = 500;
    let processed = 0;
    let summary = {
      total: sanitized.length,
      batches: 0,
      upserted: 0,
      modified: 0,
      matched: 0,
    };

    for (let i = 0; i < sanitized.length; i += batchSize) {
      const batch = sanitized.slice(i, i + batchSize);
      const ops = batch.map((doc) => {
        const filter = doc.linkedin_id
          ? { linkedin_id: doc.linkedin_id }
          : { id: doc.id };
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

    res.json({
      success: true,
      message: "Import completed",
      summary,
      processed,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /autocomplete - fast suggestions using Atlas Search (fallback to regex)
router.get("/autocomplete", rateLimiter, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const branch = req.query.branch ? String(req.query.branch) : null;
    if (!q) return res.json({ success: true, data: [] });

    const limit = 10;

    const cacheKey = `autocomplete:${branch || "all"}:${q.toLowerCase()}`;

    // Attempt to read from cache
    const cachedData = await getCached(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    // Preferred: Atlas Search autocomplete aggregation
    const pipeline = [
      {
        $search: {
          index: "alumni_autocomplete",
          compound: {
            should: [
              {
                autocomplete: {
                  query: q,
                  path: "name",
                  fuzzy: { maxEdits: 1 },
                },
              },
              {
                autocomplete: {
                  query: q,
                  path: "position",
                  fuzzy: { maxEdits: 1 },
                },
              },
              {
                autocomplete: {
                  query: q,
                  path: "current_company.name",
                  fuzzy: { maxEdits: 1 },
                },
              },
            ],
          },
        },
      },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          name: 1,
          avatar: "$avatar",
          linkedin_id: "$linkedin_id",
          position: 1,
          current_company: "$current_company.name",
        },
      },
    ];

    if (branch) {
      pipeline.splice(1, 0, { $match: { "education.field": branch } });
    }

    let results = null;
    try {
      results = await AlumniProfile.aggregate(pipeline).allowDiskUse(true);
    } catch (err) {
      // Atlas Search not available or failed — fallback to regex search
      console.warn(
        "Atlas Search failed, falling back to regex search:",
        err.message,
      );
      const safe = (s) => s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
      const regex = new RegExp(safe(q), "i");
      const match = {
        $or: [
          { name: regex },
          { position: regex },
          { "current_company.name": regex },
        ],
      };
      if (branch) match["education.field"] = branch;
      const docs = await AlumniProfile.find(match)
        .select("name avatar linkedin_id position current_company")
        .limit(limit)
        .lean();
      results = docs.map((d) => ({
        name: d.name,
        avatar: d.avatar,
        linkedin_id: d.linkedin_id,
        position: d.position,
        current_company: d.current_company?.name || null,
      }));
    }

    // Cache results
    await setCached(cacheKey, results);

    return res.json({ success: true, data: results });
  } catch (error) {
    console.error("Autocomplete error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /batch-stats - Get batch and branch distribution for visualization
router.get("/batch-stats", async (req, res) => {
  try {
    const total = await AlumniProfile.countDocuments();

    // Aggregate by batch and branch
    const stats = await AlumniProfile.aggregate([
      {
        $group: {
          _id: {
            batch: { $ifNull: ["$batch", "No Batch"] },
            branch: { $ifNull: ["$branch", "No Branch"] }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.batch": 1, "_id.branch": 1 } }
    ]);

    // Organize by batch (only year portion for cleaner display)
    const batchData = {};
    const branches = new Set();

    stats.forEach(s => {
      // Extract year from batch (e.g., "2019-08" -> "2019")
      const rawBatch = s._id.batch;
      const batch = rawBatch === "No Batch" ? "No Batch" : rawBatch.split("-")[0];
      const branch = s._id.branch;

      branches.add(branch);

      if (!batchData[batch]) {
        batchData[batch] = { total: 0, branches: {} };
      }
      batchData[batch].branches[branch] = (batchData[batch].branches[branch] || 0) + s.count;
      batchData[batch].total += s.count;
    });

    // Convert to array format
    const result = Object.entries(batchData)
      .map(([batch, data]) => ({
        batch,
        total: data.total,
        branches: data.branches
      }))
      .sort((a, b) => {
        if (a.batch === "No Batch") return 1;
        if (b.batch === "No Batch") return -1;
        return a.batch.localeCompare(b.batch);
      });

    res.json({
      success: true,
      totalAlumni: total,
      batches: result,
      allBranches: Array.from(branches).sort()
    });
  } catch (error) {
    console.error("Batch stats error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search, branch, degree, batch } = req.query;
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "24", 10), 1);
    const skip = (page - 1) * limit;

    console.log("Search query:", search);

    const pipeline = [];

    // --- AFTER (Correct) ---
    if (search && String(search).trim() !== "") {
      pipeline.push({
        $search: {
          index: "default", // Uses your main search index
          text: {
            query: String(search),
            // Searches across all important fields at once
            path: ["name", "position", "current_company.name", "location"],
            fuzzy: {
              maxEdits: 1, // Allows for one typo
            },
          },
        },
      });
    }

    const match = {};
    if (branch) match.branch = String(branch);
    if (batch) match.batch = String(batch);
    // degree filter removed as education is simplified

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    pipeline.push({
      $facet: {
        data: [
          { $sort: { experienceScore: -1, name: 1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              id: "$id",
              name: 1,
              avatar: "$avatar",
              position: 1,
              current_company: "$current_company.name",
              location: 1,
              education: 1,
              batch: 1,
              branch: 1,
              graduationYear: 1,
              experienceScore: 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
        metadata: [
          {
            $group: {
              _id: null,
              branches: { $addToSet: "$branch" },
              degrees: { $addToSet: "$education.degree" },
              batches: { $addToSet: "$batch" },
            },
          },
          { $project: { _id: 0, branches: 1, degrees: 1, batches: 1 } },
        ],
      },
    });

    const results = await AlumniProfile.aggregate(pipeline).allowDiskUse(true);

    console.log("Search results count:", results[0].data.length);

    const data = (results[0].data || []).map((d) => ({
      id: d.id,
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
        "id name about avatar position current_company experience education batch branch graduationYear updatedAt honors_and_awards url input_url",
      )
      .lean();

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    // ETag based on id + updatedAt
    const etag = crypto
      .createHash("sha1")
      .update(String(doc.id) + String(doc.updatedAt || ""))
      .digest("hex");
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "private, max-age=60");
    const ifNone = req.headers["if-none-match"];
    if (ifNone && String(ifNone) === etag) {
      return res.status(304).end();
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
      batch: doc.batch || null,
      branch: doc.branch || null,
      graduationYear: doc.graduationYear || null,
    };

    const responseEtag = crypto
      .createHash("sha1")
      .update(JSON.stringify({ ...payload, updatedAt: doc.updatedAt }))
      .digest("base64");

    const clientTag = req.headers["if-none-match"];
    if (clientTag && clientTag === responseEtag) {
      res.setHeader("ETag", responseEtag);
      res.setHeader(
        "Cache-Control",
        "public, max-age=60, stale-while-revalidate=300",
      );
      res.status(304).end();
      return;
    }

    const cacheControl = "public, max-age=60, stale-while-revalidate=300";
    res.setHeader("ETag", responseEtag);
    res.setHeader("Cache-Control", cacheControl);
    if (doc.updatedAt) {
      res.setHeader("Last-Modified", new Date(doc.updatedAt).toUTCString());
    }

    res.json({
      success: true,
      data: payload,
      metadata: {
        etag: responseEtag,
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
