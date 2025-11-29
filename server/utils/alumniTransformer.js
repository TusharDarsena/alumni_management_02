/**
 * Alumni Data Transformer
 * Transforms raw LinkedIn profile data into structured alumni profiles
 */

import { 
  extractBatchFromArray, 
  extractGraduationYear,
  extractCurrentCompany 
} from './alumniHelpers.js';

import { extractBatch, extractBranch, extractGraduationYear as extractGradYear } from '../../shared/alumniUtils.ts';

/**
 * Transform a single alumni entry from LinkedIn format to our schema
 * @param {Object} entry - Raw LinkedIn profile entry
 * @returns {Object} Transformed alumni profile
 */
export function transformAlumniEntry(entry) {
  if (!entry.url) return null;
  
  const name = entry.name || "Unknown";
  const batch = extractBatch(entry.education) || extractBatchFromArray(entry.education);
  const branch = extractBranch(entry.education); // Use the new shared function with config variations
  const graduationYear = extractGradYear(entry.education) || extractGraduationYear(entry.education);
  const current_company = extractCurrentCompany(entry);
  
  return {
    id: entry.id,
    name,
    avatar: entry.avatar || null,
    position: entry.position || null,
    current_company,
    location: entry.location || null,
    about: entry.about || null,
    education: (entry.education || []).map(edu => ({
      title: edu.title,
      degree: edu.degree,
      field: edu.field,
      start_year: edu.start_year,
      end_year: edu.end_year,
    })),
    experience: (entry.experience || []).map(exp => {
      const firstPosition = exp.positions && exp.positions.length > 0 ? exp.positions[0] : null;
      return {
        title: exp.title || (firstPosition ? firstPosition.title : null),
        company: exp.company,
        location: exp.location || (firstPosition ? firstPosition.location : null),
        start_date: exp.start_date || (firstPosition ? firstPosition.start_date : null),
        end_date: exp.end_date || (firstPosition ? firstPosition.end_date : null),
      };
    }),
    batch,
    branch,
    graduationYear,
    url: entry.url,
    linkedin_id: entry.linkedin_id,
  };
}

/**
 * Transform multiple alumni entries
 * @param {Array} entries - Array of raw LinkedIn profile entries
 * @returns {Array} Array of transformed alumni profiles
 */
export function transformAlumniEntries(entries) {
  if (!Array.isArray(entries)) return [];
  
  return entries
    .map(transformAlumniEntry)
    .filter(entry => entry !== null);
}
