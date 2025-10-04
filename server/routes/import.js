import express from "express";
import AlumniProfile from "../models/AlumniProfile.js";

const router = express.Router();

// Basic sanitizer - pick allowed keys and normalize
function sanitize(entry) {
  const doc = {};
  doc.id = entry.id || entry.linkedin_id || null;
  doc.name = entry.name || null;
  doc.first_name = entry.first_name || null;
  doc.last_name = entry.last_name || null;
  doc.city = entry.city || entry.location || null;
  doc.country_code = entry.country_code || null;
  doc.position = entry.position || null;
  doc.about = entry.about || null;
  doc.current_company = entry.current_company || null;
  doc.experience = Array.isArray(entry.experience) ? entry.experience : [];
  doc.education = Array.isArray(entry.education) ? entry.education : [];
  doc.avatar = entry.avatar || null;
  doc.followers = typeof entry.followers === "number" ? entry.followers : null;
  doc.connections =
    typeof entry.connections === "number" ? entry.connections : null;
  doc.location = entry.location || null;
  doc.input_url = entry.input_url || (entry.input && entry.input.url) || null;
  doc.linkedin_id = entry.linkedin_id || entry.input_url || doc.id || null;
  doc.linkedin_num_id = entry.linkedin_num_id || null;
  doc.banner_image = entry.banner_image || null;
  doc.honors_and_awards = entry.honors_and_awards || null;
  doc.similar_profiles = Array.isArray(entry.similar_profiles)
    ? entry.similar_profiles
    : [];
  doc.bio_links = Array.isArray(entry.bio_links) ? entry.bio_links : [];
  doc.timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();
  doc.input = entry.input || null;
  doc.default_avatar = !!entry.default_avatar;
  doc.memorialized_account = !!entry.memorialized_account;
  return doc;
}

// POST /import - Accept JSON body (array) or { files: [arrays] }
router.post("/import", async (req, res) => {
  try {
    const payload = req.body;

    let entries = [];
    if (Array.isArray(payload)) {
      entries = payload;
    } else if (payload && Array.isArray(payload.files)) {
      entries = payload.files.flat();
    } else if (payload && payload.file && Array.isArray(payload.file)) {
      entries = payload.file;
    } else {
      return res
        .status(400)
        .json({
          success: false,
          message: "Expected JSON array in request body or { files: [...] }",
        });
    }

    // Filter out invalid entries
    entries = entries.filter(
      (e) => e && (e.linkedin_id || e.id || e.url || e.input?.url),
    );
    if (entries.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid entries found" });
    }

    const BATCH_SIZE = 500;
    let processed = 0;
    let upserted = 0;
    let modified = 0;
    const errors = [];

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const ops = batch.map((entry) => {
        const doc = sanitize(entry);
        const filter = {};
        if (doc.linkedin_id) filter.linkedin_id = doc.linkedin_id;
        else if (doc.id) filter.id = doc.id;
        else filter.input_url = doc.input_url;
        return {
          updateOne: {
            filter,
            update: { $set: doc },
            upsert: true,
          },
        };
      });

      try {
        const result = await AlumniProfile.bulkWrite(ops, { ordered: false });
        // result may contain nUpserted or upsertedCount depending on driver
        upserted +=
          result.upsertedCount ||
          (result.upserted && result.upserted.length) ||
          0;
        modified += result.nModified || result.modifiedCount || 0;
        processed += batch.length;
      } catch (e) {
        console.error("Bulk write error for batch:", e);
        errors.push({ index: i, error: String(e) });
        // continue with next batches
        processed += batch.length;
      }
    }

    res.json({ success: true, processed, upserted, modified, errors });
  } catch (error) {
    console.error("Import endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
