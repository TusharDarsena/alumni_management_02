/**
 * Shared Alumni Utility Functions
 * Used by both client and server for consistent data extraction
 */

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
 * Institute name variations for matching
 * Add more variations as needed
 */
const INSTITUTE_NAME_VARIATIONS = [
  "IIIT-Naya Raipur",
  "IIIT Naya Raipur",
  "IIIT-NR",
  "IIIT NR",
  "iiitnr",
  "Dr. S.P.M. International Institute of Information Technology, Naya Raipur"
];

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
 */
export function extractBranch(education?: Education[]): string | null {
  if (!Array.isArray(education)) return null;
  const iiitEdu = education.find(edu =>
    isIIITNayaRaipur(edu.title) && (!edu.degree || isRelevantDegree(edu.degree))
  );
  
  if (!iiitEdu?.field) return null;
  
  const field = iiitEdu.field.toLowerCase();
  if (field.includes("computer science") || field.includes("cse")) return "CSE";
  if (field.includes("electronics") || field.includes("ece")) return "ECE";
  if (field.includes("data science") || field.includes("dsai")) return "DSAI";
  
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
