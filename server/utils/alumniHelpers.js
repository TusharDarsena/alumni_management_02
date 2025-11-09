/**
 * Alumni Helper Functions
 * Utility functions for parsing and extracting alumni data
 */

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
 * @returns {string} Branch code (CSE, ECE, DS) or default CSE
 */
export function extractBranch(educationStr) {
  if (educationStr.includes("Computer Science")) return "CSE";
  if (educationStr.includes("Electronics")) return "ECE";
  if (educationStr.includes("Data Science")) return "DS";
  return "CSE"; // Default
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
  const field = extractBranch(educationStr) || branchStr || "CSE"; // Use extractBranch or fallback
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
