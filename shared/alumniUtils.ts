/**
 * Shared Alumni Utility Functions
 * Used by both client and server for consistent data extraction
 */

import { INSTITUTE_NAME_VARIATIONS, BRANCH_VARIATIONS } from './config.ts';

export interface Education {
  title?: string;
  field?: string;
  start_year?: string;
  end_year?: string;
  degree?: string;
}

export interface Experience {
  title?: string;
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
}

export interface CurrentCompany {
  name?: string;
  title?: string;
  location?: string;
}

/**
 * Check if a degree is relevant (BTech, MTech, PhD)
 */
export function isRelevantDegree(degree?: string): boolean {
  if (!degree) return false;
  const deg = degree.toLowerCase();
  return deg.includes("btech") || deg.includes("b.tech") || deg.includes("bachelor of technology") ||
         deg.includes("mtech") || deg.includes("m.tech") || deg.includes("master of technology") ||
         deg.includes("phd") || deg.includes("ph.d") || deg.includes("doctor of philosophy");
}

/**
 * Check if an education entry is from IIIT-Naya Raipur
 */
function isIIITNayaRaipur(title?: string): boolean {
  if (!title) return false;
  const lowerTitle = title.toLowerCase();
  
  // Check against all known variations
  return INSTITUTE_NAME_VARIATIONS.some(variation => 
    lowerTitle === variation.toLowerCase() || 
    lowerTitle.includes(variation.toLowerCase())
  );
}

/**
 * Extract batch (start year) from education array for IIIT-Naya Raipur
 */
export function extractBatch(education?: Education[]): string | null {
  if (!Array.isArray(education)) return null;
  const iiitEdu = education.find(edu =>
    isIIITNayaRaipur(edu.title) && (!edu.degree || isRelevantDegree(edu.degree))
  );
  return iiitEdu?.start_year || null;
}

/**
 * Extract branch from education array for IIIT-Naya Raipur
 * Uses configurable branch variations for matching
 */
export function extractBranch(education?: Education[]): string | null {
  if (!Array.isArray(education)) return null;
  const iiitEdu = education.find(edu =>
    isIIITNayaRaipur(edu.title) && (!edu.degree || isRelevantDegree(edu.degree))
  );
  
  if (!iiitEdu?.field) return null;
  
  const field = iiitEdu.field.toLowerCase().trim();
  
  // Check against all branch variations
  for (const [branchName, variations] of Object.entries(BRANCH_VARIATIONS)) {
    if (variations.some(variation => field.includes(variation.toLowerCase()))) {
      return branchName;
    }
  }
  
  // Return the field as-is if no match
  return iiitEdu.field;
}

/**
 * Extract graduation year from education array
 */
export function extractGraduationYear(education?: Education[]): string | null {
  if (!Array.isArray(education)) return null;
  const iiitEdu = education.find(edu =>
    isIIITNayaRaipur(edu.title) && (!edu.degree || isRelevantDegree(edu.degree))
  );
  return iiitEdu?.end_year || null;
}

/**
 * Extract current company from experience array or current_company field
 */
export function extractCurrentCompany(
  current_company?: string | CurrentCompany,
  experience?: Experience[]
): string | null {
  // First check current_company field
  if (current_company) {
    if (typeof current_company === 'string') return current_company;
    if (typeof current_company === 'object' && current_company.name) return current_company.name;
  }
  
  // Fall back to first experience entry
  if (Array.isArray(experience) && experience.length > 0) {
    return experience[0].company || null;
  }
  
  return null;
}
