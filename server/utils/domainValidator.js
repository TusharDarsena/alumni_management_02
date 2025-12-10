import AllowedDomain from "../models/AllowedDomain.js";

/**
 * Extract domain from email address
 * @param {string} email 
 * @returns {string} domain portion of email
 */
export function extractDomain(email) {
  if (!email || typeof email !== "string") return "";
  const parts = email.toLowerCase().trim().split("@");
  return parts.length === 2 ? parts[1] : "";
}

/**
 * Check if an email domain is in the allowed domains list
 * @param {string} email 
 * @returns {Promise<boolean>}
 */
export async function isEmailDomainAllowed(email) {
  const domain = extractDomain(email);
  if (!domain) return false;

  const allowed = await AllowedDomain.findOne({ 
    domain: domain, 
    isActive: true 
  });
  
  return Boolean(allowed);
}

/**
 * Get all active allowed domains
 * @returns {Promise<string[]>}
 */
export async function getAllowedDomains() {
  const domains = await AllowedDomain.find({ isActive: true }).select("domain description createdAt");
  return domains;
}

/**
 * Add a new allowed domain
 * @param {string} domain 
 * @param {string} addedBy - clerkId of admin
 * @param {string} description - optional description
 * @returns {Promise<object>}
 */
export async function addAllowedDomain(domain, addedBy, description = "") {
  const normalized = domain.toLowerCase().trim();
  
  // Check if already exists
  const existing = await AllowedDomain.findOne({ domain: normalized });
  if (existing) {
    if (existing.isActive) {
      throw new Error("Domain already exists");
    }
    // Reactivate if previously deactivated
    existing.isActive = true;
    existing.addedBy = addedBy;
    existing.description = description;
    await existing.save();
    return existing;
  }

  const newDomain = await AllowedDomain.create({
    domain: normalized,
    addedBy,
    description,
  });
  
  return newDomain;
}

/**
 * Remove (deactivate) an allowed domain
 * @param {string} domainId 
 * @returns {Promise<boolean>}
 */
export async function removeAllowedDomain(domainId) {
  const result = await AllowedDomain.findByIdAndUpdate(
    domainId,
    { isActive: false },
    { new: true }
  );
  return Boolean(result);
}

/**
 * Seed the initial allowed domain if none exist
 */
export async function seedInitialDomain() {
  const count = await AllowedDomain.countDocuments();
  if (count === 0) {
    await AllowedDomain.create({
      domain: "iiitnr.edu.in",
      description: "IIIT Naya Raipur official domain",
      addedBy: "system",
      isActive: true,
    });
    console.log("Seeded initial allowed domain: iiitnr.edu.in");
  }
}
