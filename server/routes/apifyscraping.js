import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pLimit from 'p-limit';
import { ApifyClient } from 'apify-client';
import AlumniProfile from '../models/AlumniProfile.js';
import { transformApifyEntry } from '../utils/apifyTransformer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- CONFIGURATION ---
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

// Actor ID for "LinkedIn Profile Details Scraper + EMAIL (No Cookies Required)"
// From Apify console: https://console.apify.com/
const APIFY_ACTOR_ID = 'VhxlqQXRwhW8H5hNV';

// Initialize Apify client
let apifyClient = null;
if (APIFY_API_TOKEN) {
    apifyClient = new ApifyClient({ token: APIFY_API_TOKEN });
}

// --- UTILITY: EXTRACT USERNAME FROM URL ---
function extractUsernameFromUrl(url) {
    // Extract username from LinkedIn URL like https://linkedin.com/in/username
    const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/i);
    return match ? match[1] : null;
}

// --- UTILITY: APIFY SCRAPER ---
async function scrapeWithApify(linkedinUrl) {
    console.log(`   📡 Calling Apify LinkedIn Scraper...`);
    console.log(`   🔗 URL: ${linkedinUrl}`);

    if (!apifyClient) {
        throw new Error('APIFY_API_TOKEN is not set in environment variables');
    }

    // Extract username from URL for Apify input
    const username = extractUsernameFromUrl(linkedinUrl);
    if (!username) {
        throw new Error('Could not extract username from LinkedIn URL');
    }
    console.log(`   👤 Username: ${username}`);

    // Prepare input - using username as shown in Apify console
    const input = {
        username: username,
        includeEmail: true  // Enable email extraction
    };

    // Run the Actor and wait for it to finish
    console.log(`   ⏳ Running Apify actor...`);
    const run = await apifyClient.actor(APIFY_ACTOR_ID).call(input);

    // Fetch results from the run's dataset
    console.log(`   📥 Fetching results from dataset...`);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    if (items && items.length > 0) {
        console.log(`   ✅ Apify returned profile data`);
        return items[0];
    } else {
        throw new Error('Apify returned empty or invalid data');
    }
}

// --- GLOBAL JOB STATE ---
let activeJob = {
    isRunning: false,
    total: 0,
    processed: 0,
    currentName: "",
    logs: [],
    queue: [],
    failedQueue: [],
    shouldStop: false
};

// --- MAIN PROCESSOR ---
async function processSingleProfile(profileData) {
    const alumniName = typeof profileData === 'object' ? profileData.name : profileData;
    const batch = typeof profileData === 'object' ? profileData.batch : "";
    const linkedinUrl = typeof profileData === 'object' ? (profileData.url || profileData.linkedinUrl) : null;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 PROCESSING PROFILE: ${alumniName}`);
    console.log(`   📅 Batch: ${batch || "Not specified"}`);
    console.log(`   🔗 URL: ${linkedinUrl}`);

    if (!linkedinUrl) {
        throw new Error('LinkedIn URL is required for Apify scraping');
    }

    // STEP 1: SCRAPE DATA VIA APIFY
    console.log(`\n🔄 STEP 1: Scraping Full Profile via Apify...`);
    const profileJson = await scrapeWithApify(linkedinUrl);
    console.log(`   ✅ JSON received from Apify`);

    // STEP 2: ADD METADATA
    // Add batch info and original URL to the JSON for later use
    profileJson._metadata = {
        batch: batch || null,
        originalUrl: linkedinUrl,
        scrapedAt: new Date().toISOString(),
        source: 'apify'
    };

    // STEP 3: SAVE TO FILE (in separate apify_data folder)
    console.log(`\n🔄 STEP 2: Saving Data`);
    const urlDirPath = path.join(__dirname, '../../client/data/apify_data');
    if (!fs.existsSync(urlDirPath)) fs.mkdirSync(urlDirPath, { recursive: true });

    const safeName = alumniName.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
    const filename = `${safeName}_apify.json`;
    const filePath = path.join(urlDirPath, filename);

    fs.writeFileSync(filePath, JSON.stringify(profileJson, null, 2));
    console.log(`   💾 Saved to: ${filename}`);

    // STEP 4: TRANSFORM AND SEED TO DB
    console.log(`\n🔄 STEP 3: Seeding to Database...`);
    const transformedData = transformApifyEntry(profileJson);

    if (transformedData) {
        // Use linkedin_id as the unique identifier
        const filter = { linkedin_id: transformedData.linkedin_id };
        await AlumniProfile.updateOne(filter, { $set: transformedData }, { upsert: true });
        console.log(`   ✅ Seeded to DB: ${transformedData.name} (${transformedData.linkedin_id})`);
    } else {
        console.log(`   ⚠️ Could not transform data for DB (missing linkedin_id)`);
    }

    return { success: true, filename };
}

// --- ROUTES ---

// Single profile scraping (direct URL)
router.post('/direct-profile', async (req, res) => {
    const { linkedinUrl, name, batch } = req.body;

    if (!linkedinUrl) {
        return res.status(400).json({ message: 'linkedinUrl is required' });
    }

    if (!name) {
        return res.status(400).json({ message: 'name is required' });
    }

    try {
        console.log(`\n📥 APIFY SCRAPE REQUEST: ${name}`);
        const result = await processSingleProfile({ name, batch, linkedinUrl });
        return res.status(200).json({
            success: true,
            message: `Scraped ${name} via Apify`,
            filename: result.filename
        });
    } catch (error) {
        console.error(`❌ Apify Scrape Error:`, error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Start batch scraping
router.post('/start-batch', async (req, res) => {
    const { profiles, concurrency } = req.body;

    if (!profiles || !Array.isArray(profiles)) {
        return res.status(400).json({ message: "Profiles array required" });
    }

    if (activeJob.isRunning) {
        return res.status(409).json({ message: "Job already running" });
    }

    // Validate concurrency (1-10, default 3)
    const validConcurrency = concurrency ? Math.min(10, Math.max(1, parseInt(concurrency))) : 3;

    activeJob = {
        isRunning: true,
        total: profiles.length,
        processed: 0,
        currentName: "Initializing...",
        logs: [],
        queue: profiles,
        failedQueue: [],
        shouldStop: false,
        concurrency: validConcurrency
    };

    res.json({ success: true, message: `Batch started with ${profiles.length} profiles` });
    runBackgroundJob();
});

// Get job status
router.get('/status', (req, res) => {
    res.json(activeJob);
});

// Stop batch
router.post('/stop-batch', (req, res) => {
    activeJob.shouldStop = true;
    activeJob.logs.unshift("⚠ Stop requested by user...");
    res.json({ success: true });
});

// Report skipped profiles (invalid URLs from frontend)
router.post('/report-skipped', async (req, res) => {
    const { skippedProfiles, batch } = req.body;

    if (!skippedProfiles || !Array.isArray(skippedProfiles) || skippedProfiles.length === 0) {
        return res.status(400).json({ message: "No skipped profiles to report" });
    }

    try {
        const skippedDir = path.join(__dirname, '../../client/data/apify_data');
        if (!fs.existsSync(skippedDir)) fs.mkdirSync(skippedDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `skipped_profiles_${timestamp}.json`;
        const filePath = path.join(skippedDir, filename);

        const record = {
            generatedAt: new Date().toISOString(),
            batch: batch || null,
            reason: "Invalid or empty LinkedIn URL",
            totalSkipped: skippedProfiles.length,
            profiles: skippedProfiles
        };

        fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
        console.log(`📝 Skipped profiles saved to: ${filename}`);

        return res.json({ success: true, filename });
    } catch (error) {
        console.error("Failed to save skipped profiles:", error);
        return res.status(500).json({ message: error.message });
    }
});

// Background job processor
async function runBackgroundJob() {
    const concurrency = activeJob.concurrency || 3;
    console.log(`\n🚀 Starting Apify Parallel Batch (Concurrency: ${concurrency})`);
    activeJob.logs.unshift(`🚀 Starting batch with concurrency: ${concurrency}`);

    const limit = pLimit(concurrency);

    const tasks = activeJob.queue.map((item, index) => {
        return limit(async () => {
            if (activeJob.shouldStop) return;

            const name = typeof item === 'object' ? item.name : item;
            activeJob.currentName = `Processing: ${name}`;

            try {
                await processSingleProfile(item);
                activeJob.processed++;
                activeJob.logs.unshift(`✅ Success: ${name}`);
            } catch (error) {
                activeJob.processed++;
                console.error(`❌ Error [${name}]:`, error.message);
                activeJob.failedQueue.push({
                    ...item,
                    error: error.message,
                    failedAt: new Date().toISOString()
                });
                activeJob.logs.unshift(`⚠ Failed: ${name} - ${error.message}`);
            }
        });
    });

    await Promise.all(tasks);

    // Save failed profiles to JSON for tracking
    if (activeJob.failedQueue.length > 0) {
        await saveFailedProfiles(activeJob.failedQueue);
    }

    // Mark job complete
    activeJob.isRunning = false;
    activeJob.currentName = "Completed";

    if (activeJob.failedQueue.length > 0) {
        activeJob.logs.unshift(`🏁 Done. ${activeJob.failedQueue.length} items failed. See failed_profiles.json for details.`);
    } else {
        activeJob.logs.unshift("🎉 Batch Finished Successfully!");
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ APIFY BATCH COMPLETE`);
    console.log(`   Total: ${activeJob.total} | Success: ${activeJob.processed - activeJob.failedQueue.length} | Failed: ${activeJob.failedQueue.length}`);
}

// --- UTILITY: SAVE FAILED PROFILES TO JSON ---
async function saveFailedProfiles(failedQueue) {
    const failedDir = path.join(__dirname, '../../client/data/apify_data');
    if (!fs.existsSync(failedDir)) fs.mkdirSync(failedDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `failed_profiles_${timestamp}.json`;
    const filePath = path.join(failedDir, filename);

    const record = {
        generatedAt: new Date().toISOString(),
        totalFailed: failedQueue.length,
        profiles: failedQueue.map(item => ({
            name: item.name,
            linkedinUrl: item.linkedinUrl || item.url,
            batch: item.batch,
            error: item.error,
            failedAt: item.failedAt
        }))
    };

    fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
    console.log(`   📝 Failed profiles saved to: ${filename}`);
}

export default router;

