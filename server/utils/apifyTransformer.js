/**
 * Apify Data Transformer
 * Transforms Apify LinkedIn profile JSON into our AlumniProfile schema
 */

import { extractBatch, extractBranch, extractGraduationYear } from '../../shared/alumniUtils.ts';

/**
 * Transform Apify education format to our schema
 */
function transformApifyEducation(apifyEducation) {
    if (!Array.isArray(apifyEducation)) return [];

    return apifyEducation.map(edu => {
        // Extract years from start_date and end_date objects
        const startYear = edu.start_date?.year?.toString() || null;
        const endYear = edu.end_date?.year?.toString() || null;

        return {
            title: edu.school || null,                        // Apify uses "school"
            degree: edu.degree_name || edu.degree || null,
            field: edu.field_of_study || null,
            url: edu.school_linkedin_url || null,
            start_year: startYear,
            end_year: endYear,
            description: edu.activities || edu.description || null,
            institute_logo_url: edu.school_logo_url || null,  // Apify uses "school_logo_url"
        };
    });
}

/**
 * Transform Apify experience format to our schema
 */
function transformApifyExperience(apifyExperience) {
    if (!Array.isArray(apifyExperience)) return [];

    return apifyExperience.map(exp => {
        // Format start_date and end_date from objects to strings
        const startDate = exp.start_date
            ? `${exp.start_date.month || ''} ${exp.start_date.year || ''}`.trim()
            : null;
        const endDate = exp.is_current
            ? 'Present'
            : (exp.end_date
                ? `${exp.end_date.month || ''} ${exp.end_date.year || ''}`.trim()
                : null);

        return {
            title: exp.title || null,
            company: exp.company || null,
            location: exp.location || null,
            description_html: exp.description || null,
            start_date: startDate,
            end_date: endDate,
            duration: exp.duration || null,
            company_id: exp.company_id || null,
            url: exp.company_linkedin_url || null,
            company_logo_url: exp.company_logo_url || null,
        };
    });
}

/**
 * Extract current company info from Apify format
 */
function extractCurrentCompany(apifyData) {
    const basicInfo = apifyData.basic_info || {};
    const experience = apifyData.experience || [];

    // Try to get from basic_info first
    if (basicInfo.current_company) {
        return {
            name: basicInfo.current_company,
            company_id: basicInfo.current_company_urn || null,
            title: experience[0]?.title || null,
            location: experience[0]?.location || null,
        };
    }

    // Fallback: find current job from experience
    const currentJob = experience.find(exp => exp.is_current);
    if (currentJob) {
        return {
            name: currentJob.company,
            company_id: currentJob.company_id || null,
            title: currentJob.title || null,
            location: currentJob.location || null,
        };
    }

    return null;
}

/**
 * Transform a single Apify entry to our AlumniProfile schema
 * @param {Object} apifyData - Raw Apify profile data
 * @returns {Object} Transformed alumni profile ready for MongoDB
 */
export function transformApifyEntry(apifyData) {
    const basicInfo = apifyData.basic_info || {};
    const metadata = apifyData._metadata || {};

    // Get LinkedIn ID from public_identifier or URL
    const linkedinId = basicInfo.public_identifier ||
        (basicInfo.profile_url?.match(/linkedin\.com\/in\/([^\/\?]+)/)?.[1]) ||
        null;

    if (!linkedinId) {
        console.warn('No LinkedIn ID found for entry:', basicInfo.fullname);
        return null;
    }

    // Transform education first (needed for batch/branch extraction)
    const education = transformApifyEducation(apifyData.education);

    // Build the document
    const doc = {
        id: linkedinId,
        linkedin_id: linkedinId,
        name: basicInfo.fullname || basicInfo.first_name || 'Unknown',
        first_name: basicInfo.first_name?.trim() || null,
        last_name: basicInfo.last_name?.trim() || null,
        position: basicInfo.headline || null,
        about: basicInfo.about || null,
        avatar: basicInfo.profile_picture_url || null,
        banner_image: basicInfo.background_picture_url || null,

        // Location
        location: basicInfo.location?.full || null,
        city: basicInfo.location?.city || null,
        country_code: basicInfo.location?.country_code || null,

        // Social stats
        followers: basicInfo.follower_count || null,
        connections: basicInfo.connection_count || null,

        // URLs
        url: basicInfo.profile_url || metadata.originalUrl || null,
        input_url: metadata.originalUrl || basicInfo.profile_url || null,
        input: { url: metadata.originalUrl || basicInfo.profile_url || null },

        // Current company
        current_company: extractCurrentCompany(apifyData),
        current_company_name: basicInfo.current_company || null,
        current_company_company_id: basicInfo.current_company_urn || null,

        // Education & Experience
        education: education,
        experience: transformApifyExperience(apifyData.experience),

        // Batch info from metadata (user-provided) or extracted from education
        batch: metadata.batch || extractBatch(education) || null,
        branch: extractBranch(education) || null,
        graduationYear: extractGraduationYear(education) || null,

        // Metadata
        timestamp: metadata.scrapedAt ? new Date(metadata.scrapedAt) : new Date(),

        // LinkedIn-specific
        linkedin_num_id: basicInfo.urn || null,

        // Email (from Apify with includeEmail: true)
        email: basicInfo.email || null,
    };

    // Remove null/undefined values
    Object.keys(doc).forEach(key => {
        if (doc[key] === null || doc[key] === undefined) {
            delete doc[key];
        }
    });

    return doc;
}

/**
 * Transform multiple Apify entries
 * @param {Array} entries - Array of Apify profile data
 * @returns {Array} Array of transformed alumni profiles
 */
export function transformApifyEntries(entries) {
    if (!Array.isArray(entries)) return [];

    return entries
        .map(transformApifyEntry)
        .filter(entry => entry !== null);
}
