/**
 * Alumni Data Normalizer
 * Handles sanitization and normalization of raw alumni data
 */

import { parseEducation } from './alumniHelpers.js';
import { extractBatch, extractBranch, extractGraduationYear } from '../../shared/alumniUtils.ts';

/**
 * Normalize and sanitize a single alumni entry
 * @param {Object} entry - Raw alumni data entry
 * @returns {Object} Normalized alumni document
 */
export function normalizeAlumniEntry(entry) {
  const linkedin_id = String(
    entry.linkedin_id ||
      entry.id ||
      (entry.input && entry.input.url
        ? entry.input.url.split("/").pop()
        : "") ||
      "",
  ).trim();
  const input_url =
    entry.input?.url || entry.input_url || entry.url || null;

  const doc = {
    id: entry.id || linkedin_id || undefined,
    name: entry.name || "Unknown",
    first_name:
      entry.first_name ||
      (entry.name ? String(entry.name).split(" ")[0] : undefined),
    last_name:
      entry.last_name ||
      (entry.name
        ? String(entry.name).split(" ").slice(1).join(" ")
        : undefined),
    city: entry.city || undefined,
    country_code: entry.country_code || undefined,
    position: entry.position || undefined,
    about: entry.about || undefined,
    current_company:
      entry.current_company ||
      (entry.current_company_name || entry.current_company_company_id
        ? {
            name: entry.current_company_name || null,
            company_id: entry.current_company_company_id || null,
            title: entry.current_company_title || null,
            location: entry.current_company_location || null,
          }
        : undefined),
    experience: Array.isArray(entry.experience)
      ? entry.experience
      : undefined,
    education: Array.isArray(entry.education) 
      ? entry.education 
      : parseEducation(entry.education || ""),
    avatar: entry.avatar || undefined,
    followers: entry.followers ? Number(entry.followers) : undefined,
    connections: entry.connections ? Number(entry.connections) : undefined,
    current_company_company_id:
      entry.current_company_company_id || undefined,
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

  // Extract batch, branch, and graduation year from education if not already set
  const educationData = doc.education || entry.education;
  if (Array.isArray(educationData)) {
    if (!entry.batch) {
      doc.batch = extractBatch(educationData) || undefined;
    } else {
      doc.batch = entry.batch;
    }
    
    if (!entry.branch) {
      doc.branch = extractBranch(educationData) || undefined;
    } else {
      doc.branch = entry.branch;
    }
    
    if (!entry.graduationYear) {
      doc.graduationYear = extractGraduationYear(educationData) || undefined;
    } else {
      doc.graduationYear = entry.graduationYear;
    }
  } else {
    doc.batch = entry.batch || undefined;
    doc.branch = entry.branch || undefined;
    doc.graduationYear = entry.graduationYear || undefined;
  }

  // Remove undefined properties to avoid overwriting with undefined
  Object.keys(doc).forEach((k) => doc[k] === undefined && delete doc[k]);
  return doc;
}

/**
 * Normalize an array of alumni entries
 * @param {Array} entries - Array of raw alumni data
 * @returns {Array} Array of normalized alumni documents
 */
export function normalizeAlumniEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }
  
  return entries
    .map(normalizeAlumniEntry)
    .filter((d) => d.linkedin_id || d.id);
}
