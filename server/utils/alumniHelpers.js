/**
 * Alumni Helper Functions
 * Utility functions for parsing and extracting alumni data
 */

/**
 * Check if a degree is relevant (BTech, MTech, PhD)
 * @param {string} degree - Degree string
 * @returns {boolean} Whether the degree is relevant
 */
export function isRelevantDegree(degree) {
  if (!degree) return false;
  const deg = degree.toLowerCase();
  return deg.includes("btech") || deg.includes("b.tech") || deg.includes("bachelor of technology") ||
         deg.includes("mtech") || deg.includes("m.tech") || deg.includes("master of technology") ||
         deg.includes("phd") || deg.includes("ph.d") || deg.includes("doctor of philosophy");
}

/**
 * Extract batch year from education array (for LinkedIn profile format)
 * @param {Array} education - Array of education objects
 * @returns {string|null} Batch year (start year) or null
 */
export function extractBatchFromArray(education) {
  if (!Array.isArray(education)) return null;
  const iiitEdu = education.find(edu =>
    edu.title && edu.title.toLowerCase().includes("iiit-naya raipur") &&
    isRelevantDegree(edu.degree)
  );
  return iiitEdu ? iiitEdu.start_year : null;
}

/**
 * Extract branch from education array (for LinkedIn profile format)
 * @param {Array} education - Array of education objects
 * @returns {string|null} Branch code (CSE, ECE, DSAI) or null if not found
 */
export function extractBranchFromArray(education) {
  if (!Array.isArray(education)) return null;
  const iiitEdu = education.find(edu =>
    edu.title && edu.title.toLowerCase().includes("iiit-naya raipur") &&
    isRelevantDegree(edu.degree)
  );
  if (!iiitEdu) return null;
  const field = iiitEdu.field;
  if (!field) return null;
  const f = field.toLowerCase();
  if (f.includes("computer science")) return "CSE";
  if (f.includes("electronics") && f.includes("communication")) return "ECE";
  if (f.includes("data science")) return "DSAI";
  return null;
}

/**
 * Extract graduation year from education array
 * @param {Array} education - Array of education objects
 * @returns {string|null} Graduation year (end year) or null
 */
export function extractGraduationYear(education) {
  if (!Array.isArray(education)) return null;
  const iiitEdu = education.find(edu =>
    edu.title && edu.title.toLowerCase().includes("iiit-naya raipur") &&
    isRelevantDegree(edu.degree)
  );
  return iiitEdu ? iiitEdu.end_year : null;
}

/**
 * Extract current company information from alumni entry
 * @param {Object} entry - Alumni profile entry
 * @returns {Object|null} Current company object or null
 */
export function extractCurrentCompany(entry) {
  if (entry.current_company) {
    return {
      name: entry.current_company.name,
      title: entry.current_company.title,
      location: entry.current_company.location
    };
  }
  if (entry.experience && entry.experience.length > 0) {
    const latestExp = entry.experience[0];
    return {
      name: latestExp.company,
      title: latestExp.title,
      location: latestExp.location
    };
  }
  return null;
}

/**
 * Extract batch year from education string
 * @param {string} education - Education string containing year range
 * @returns {string|null} Batch year (end year) or null
 */
export function extractBatch(education) {
  const match = education.match(/(\d{4})\s*-\s*(\d{4})/);
  return match ? match[2] : null; // End year as batch
}

/**
 * Extract branch from education string
 * @param {string} educationStr - Education string containing branch/major information
 * @returns {string|null} Branch code (CSE, ECE, DS) or null if not found
 */
export function extractBranch(educationStr) {
  if (educationStr.includes("Computer Science")) return "CSE";
  if (educationStr.includes("Electronics")) return "ECE";
  if (educationStr.includes("Data Science")) return "DS";
  return null;
}

/**
 * Parse education string into structured object
 * @param {string} educationStr - Raw education string
 * @returns {Array} Array of education objects
 */
export function parseEducation(educationStr) {
  if (!educationStr || educationStr === "") return [];
  // Example: "IIIT-Naya Raipur, Bachelor of Technology (BTech), Electronics and Communications Engineering, 2017-2021"
  const parts = educationStr.split(",");
  const institute = parts[0]?.trim() || null;
  const degreeFull = parts[1]?.trim() || "";
  const branchStr = parts[2]?.trim() || "";
  const years = parts[3]?.trim() || "";
  const yearMatch = years.match(/(\d{4})\s*-\s*(\d{4})/);
  const start_year = yearMatch ? parseInt(yearMatch[1]) : null;
  const end_year = yearMatch ? parseInt(yearMatch[2]) : null;
  const degree =
    degreeFull.replace("(BTech)", "").trim() + (branchStr ? ` in ${branchStr}` : "");
  const field = extractBranch(educationStr) || branchStr || null;
  return [{ field, degree, institute, start_year, end_year }];
}

/**
 * Parse experience data into structured format
 * @param {string} title - Job title
 * @param {string} company - Company name
 * @param {string} location - Job location
 * @param {string} experienceStr - Experience string (e.g., "5+ years")
 * @returns {Array} Array of experience objects
 */
export function parseExperience(title, company, location, experienceStr) {
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

/**
 * Categorize skills into technical and core skills
 * @param {string} skillsStr - Comma-separated skills string
 * @returns {Object} Object with technical and core skill arrays
 */
export function categorizeSkills(skillsStr) {
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
