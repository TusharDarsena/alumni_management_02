import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedUsers } from '../scripts/seedUser.js';
import { AirtopClient } from '@airtop/sdk';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- CONFIGURATION ---
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
const BRIGHTDATA_API_BASE = 'https://api.brightdata.com/datasets/v3';
const TRIGGER_ENDPOINT = `${BRIGHTDATA_API_BASE}/trigger?dataset_id=${DATASET_ID}&include_errors=true`;
const PROGRESS_ENDPOINT = `${BRIGHTDATA_API_BASE}/progress`;
const SNAPSHOT_ENDPOINT = `${BRIGHTDATA_API_BASE}/snapshot`;

const SERP_API_ENDPOINT = 'https://api.brightdata.com/request';
const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY;
const AIRTOP_API_KEY = process.env.AIRTOP_API_KEY;

const airtopClient = new AirtopClient({ apiKey: AIRTOP_API_KEY });

// --- UTILITY: FUZZY STRING MATCHING ---
function getSimilarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) { longer = s2; shorter = s1; }
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
    const costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i == 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

// --- UTILITY: BRIGHT DATA POLLING HELPER ---
async function scrapeWithBrightData(url) {
    console.log(`   📡 Triggering Bright Data Collector...`);

    const triggerResponse = await fetch(TRIGGER_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ "url": url }])
    });

    if (!triggerResponse.ok) {
        throw new Error(`Bright Data Trigger Failed: ${triggerResponse.status}`);
    }

    const triggerData = await triggerResponse.json();

    if (!triggerData.snapshot_id) {
        console.log("   ⚡ Received immediate data (Sync mode)");
        return Array.isArray(triggerData) ? triggerData[0] : triggerData;
    }

    const snapshotId = triggerData.snapshot_id;
    console.log(`   ⏳ Job Queued. Snapshot ID: ${snapshotId}`);

    let isReady = false;

    while (!isReady) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
        console.log(`   🔎 Checking status...`);

        const progressResponse = await fetch(`${PROGRESS_ENDPOINT}/${snapshotId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${BRIGHTDATA_API_KEY}` }
        });

        if (!progressResponse.ok) continue;

        const progressData = await progressResponse.json();

        if (progressData.status === 'ready') {
            console.log(`   ✅ Job Finished! Downloading data...`);
            isReady = true;
        } else if (progressData.status === 'failed') {
            throw new Error("Bright Data reported the scraping job FAILED.");
        }
    }

    const downloadResponse = await fetch(`${SNAPSHOT_ENDPOINT}/${snapshotId}?format=json`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${BRIGHTDATA_API_KEY}` }
    });

    if (!downloadResponse.ok) throw new Error(`Failed to download snapshot: ${downloadResponse.status}`);

    const finalData = await downloadResponse.json();
    return (Array.isArray(finalData) && finalData.length > 0) ? finalData[0] : finalData;
}

// --- UTILITY: DEEP JSON VERIFICATION ---
function verifyScrapedData(profileJson, requiredBatch) {
    console.log("   [Deep Verification] Analyzing Scraped JSON...");

    const educationList = profileJson.education || [];
    const experienceList = profileJson.experience || []; // Check exp too, sometimes college is listed there

    // Normalize string helper
    const norm = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const collegeKeywords = ["iiitnayaraipur", "iiitnr", "internationalinstituteofinformationtechnologynayaraipur", "iiit", "raipur"];

    let hasCollege = false;

    // Check Education
    for (const edu of educationList) {
        const schoolName = norm(edu.school_name || edu.school || "");
        if (collegeKeywords.some(k => schoolName.includes(k))) hasCollege = true;
    }

    // Check Experience (Backup)
    if (!hasCollege) {
        for (const exp of experienceList) {
            const companyName = norm(exp.company || exp.company_name || "");
            if (collegeKeywords.some(k => companyName.includes(k))) hasCollege = true;
        }
    }

    if (!hasCollege) {
        console.log("   [Deep Verification] ❌ FAILED: No IIITNR found in Education or Experience.");
        return false;
    }

    console.log("   [Deep Verification] ✅ SUCCESS: University confirmed.");
    return true;
}

// --- GLOBAL JOB STATE ---
let activeJob = {
    isRunning: false, total: 0, processed: 0, currentName: "",
    logs: [], queue: [], failedQueue: [], forceFallback: false, shouldStop: false
};

// --- HELPER 1: AIRTOP SEARCH (Restored Smart Logic) ---
async function findUrlWithAirtop(alumniName, batch, useStrictPrompt = true) {
    const mode = useStrictPrompt ? "Strict" : "Loose";
    console.log(`   [Primary] 🤖 Airtop Search (${mode} Mode)...`);

    let session;
    try {
        session = await airtopClient.sessions.create();
        const sessionId = session.data.id;

        // Dynamic Query: Loose mode removes batch to find anyone with that name
        const batchQuery = (batch && useStrictPrompt) ? `"${batch}"` : "";
        const searchQuery = `"${alumniName}" "IIIT-Naya Raipur" ${batchQuery} site:linkedin.com/in/`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

        const window = await airtopClient.windows.create(sessionId, { url: googleUrl });
        const windowId = window.data.windowId;

        // Dynamic Prompt
        let promptText = "";

        if (useStrictPrompt) {
            // STRICT: Must mention IIITNR explicitly
            promptText = `Find LinkedIn URL for "${alumniName}" from IIIT Naya Raipur.
            Rules:
            1. MANDATORY: Snippet must mention "IIIT Naya Raipur" or "IIITNR".
            2. ${batch ? `MANDATORY: Snippet must contain years "${batch}".` : ""}
            3. Return URL or empty string.`;
        } else {
            // LOOSE: Find best name match, allow other universities if they studied at IIITNR before
            promptText = `Find the most likely LinkedIn URL for "${alumniName}" who studied at IIIT Naya Raipur.
            Rules:
            1. Ignore generic lists.
            2. MULTI-UNIVERSITY: If they are currently at IIT/CMU but have IIITNR in history, ACCEPT IT.
            3. Ignore batch mismatch for now.
            4. Return URL or empty string.`;
        }

        const result = await airtopClient.windows.pageQuery(sessionId, windowId, {
            prompt: promptText,
            configuration: {
                outputSchema: {
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "type": "object",
                    "properties": { "url": { "type": "string" } },
                    "required": ["url"]
                }
            }
        });

        await airtopClient.sessions.terminate(sessionId);
        session = null;

        const content = JSON.parse(result.data.modelResponse);
        if (content.url && content.url.includes('linkedin.com/in/')) {
            console.log(`   [Airtop] Found: ${content.url}`);
            return content.url;
        }
        return null;

    } catch (error) {
        console.log(`   [Airtop] Error: ${error.message}`);
        if (session) try { await airtopClient.sessions.terminate(session.data.id); } catch (e) { }
        return null;
    }
}

// --- HELPER 2: BRIGHTDATA SERP ---
async function findUrlWithBrightDataFallback(alumniName, batch) {
    console.log(`\n   [Fallback] 🔄 Switching to Bright Data SERP...`);
    const query = `"${alumniName}" AND ("IIIT-Naya Raipur" OR "IIITNR") linkedin`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&gl=in`;

    try {
        const response = await fetch(SERP_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ "zone": "serp_api1", "url": googleSearchUrl, "format": "raw" })
        });

        if (!response.ok) throw new Error(`SERP API Error: ${response.status}`);
        const html = await response.text();
        const $ = cheerio.load(html);

        let bestMatch = null;
        let highestScore = 0;
        const batchYears = batch ? batch.split(/[-/]/).map(y => y.trim()) : [];

        $('a').each((i, el) => {
            const link = $(el).attr('href');
            const title = $(el).find('h3').text() || $(el).text();
            const snippet = $(el).parent().text().toLowerCase();

            if (!link || !title) return;
            if (!link.includes("linkedin.com/in/")) return;
            if (link.includes("/posts/") || link.includes("/jobs/") || link.includes("/company/")) return;

            const cleanTitle = title.toLowerCase().replace("linkedin", "").replace(" - ", " ").trim();
            const cleanName = alumniName.toLowerCase().trim();
            const similarity = getSimilarity(cleanTitle, cleanName);
            const isNameInTitle = cleanTitle.includes(cleanName);

            if (!isNameInTitle && similarity < 0.5) return;

            let score = isNameInTitle ? 0.5 : 0.3;
            const hasCollege = snippet.includes("iiitnr") || snippet.includes("naya raipur") || snippet.includes("iiit-nr");
            if (hasCollege) score += 0.4;

            if (batchYears.length > 0) {
                batchYears.forEach(year => { if (snippet.includes(year)) score += 0.3; });
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = link;
            }
        });

        if (bestMatch && highestScore >= 0.45) return bestMatch;
        return null;

    } catch (error) {
        console.log(`   [Fallback] ❌ SERP Error: ${error.message}`);
        return null;
    }
}

// --- MAIN PROCESSOR (The 3-Stage Rocket) ---
async function processSingleProfile(profileData, forceFallback = false) {
    const alumniName = typeof profileData === 'object' ? profileData.name : profileData;
    const batch = typeof profileData === 'object' ? profileData.batch : "";
    const directUrl = typeof profileData === 'object' ? (profileData.url || profileData.linkedinUrl) : null;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 PROCESSING PROFILE: ${alumniName}`);
    console.log(`   📅 Batch: ${batch || "Any"} | Mode: ${forceFallback ? "Fallback" : "Primary"}`);

    let foundUrl = null;

    // STEP 1: FIND URL
    if (directUrl) {
        console.log(`   🔗 Direct URL Provided: ${directUrl}`);
        foundUrl = directUrl;
    } else {
        // STAGE 1: STRICT
        if (!forceFallback) {
            foundUrl = await findUrlWithAirtop(alumniName, batch, true);
        }

        // STAGE 2: FALLBACK
        if (!foundUrl && forceFallback) {
            foundUrl = await findUrlWithBrightDataFallback(alumniName, batch);
        }

        // STAGE 3: DESPERATE MODE (Loose Airtop + Deep Verify)
        if (!foundUrl && !forceFallback) {
            console.log(`⚠ Strict Search failed. Attempting "Desperate Mode" (Loose Search)...`);
            foundUrl = await findUrlWithAirtop(alumniName, batch, false);
        }

        if (!foundUrl) throw new Error("Could not find any profile.");
    }

    // STEP 2: SCRAPE DATA
    console.log(`\n🔄 STEP 2: Scraping Full Profile (Async Mode)...`);
    const profileJson = await scrapeWithBrightData(foundUrl);
    console.log(`   ✅ JSON received.`);

    // STEP 3: VALIDATION (DISABLED - validation commented out)
    // Validation is now disabled for all scraping methods
    console.log(`\n🛡 STEP 3: Skipping Validation (disabled)`);
    /*
    // Skip validation if direct URL was provided (user has already verified alumni)
    if (directUrl) {
        console.log(`\n🛡 STEP 3: Skipping Validation (Direct URL provided - trusted source)`);
    } else {
        console.log(`\n🛡 STEP 3: Validating University...`);
        const isValid = verifyScrapedData(profileJson, batch);

        if (!isValid) {
            // If we are in fallback/desperate mode, validation failure is fatal
            throw new Error("Validation Failed: Profile found, but user did not study at IIITNR.");
        }
    }
    */

    // STEP 4: SAVE
    console.log(`\n🔄 STEP 4: Saving Data`);
    const urlDirPath = path.join(__dirname, '../../client/data/alumnidata');
    if (!fs.existsSync(urlDirPath)) fs.mkdirSync(urlDirPath, { recursive: true });

    const safeName = alumniName.toLowerCase().replace(/ /g, '_');
    fs.writeFileSync(path.join(urlDirPath, `${safeName}_linkedin_url.txt`), foundUrl);
    if (batch) profileJson.batch = batch;

    fs.writeFileSync(path.join(urlDirPath, `${safeName}.json`), JSON.stringify(profileJson, null, 2));

    // Sync DB
    await seedUsers(true);

    return "Success";
}

// --- ROUTES ---

router.post('/start-batch', async (req, res) => {
    const { profiles, forceFallback, concurrency } = req.body;
    if (!profiles || !Array.isArray(profiles)) return res.status(400).json({ message: "Profiles array required" });
    if (activeJob.isRunning) return res.status(409).json({ message: "Job already running" });

    // Validate concurrency (1-10, default is handled in runBackgroundJob)
    const validConcurrency = concurrency ? Math.min(10, Math.max(1, parseInt(concurrency))) : null;

    activeJob = {
        isRunning: true, total: profiles.length, processed: 0,
        currentName: "Initializing...", logs: [], queue: profiles,
        failedQueue: [], forceFallback: !!forceFallback, shouldStop: false,
        concurrency: validConcurrency  // Store user-defined concurrency
    };

    res.json({ success: true, message: "Batch started" });
    runBackgroundJob();
});

router.get('/status', (req, res) => { res.json(activeJob); });

router.post('/stop-batch', (req, res) => {
    activeJob.shouldStop = true;
    activeJob.logs.unshift("⚠ Stop requested by user...");
    res.json({ success: true });
});

router.post('/get-linkedin-profile', async (req, res) => {
    const { alumniName, batch, forceFallback } = req.body;
    if (!alumniName) return res.status(400).json({ message: 'Name required' });

    try {
        await processSingleProfile({ name: alumniName, batch }, forceFallback);
        return res.status(200).json({ success: true, message: `Scraped ${alumniName}` });
    } catch (error) {
        if (error.code === 'AIRTOP_FAILED' || error.message.includes('Airtop')) {
            return res.status(422).json({ success: false, code: 'AIRTOP_FAILED', message: 'Airtop failed.' });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/direct-profile', async (req, res) => {
    const { linkedinUrl, name, batch } = req.body;
    try {
        const profileJson = await scrapeWithBrightData(linkedinUrl);
        const urlDirPath = path.join(__dirname, '../../client/data/alumnidata');
        if (!fs.existsSync(urlDirPath)) fs.mkdirSync(urlDirPath, { recursive: true });
        const safeName = name.toLowerCase().replace(/ /g, '_');
        if (batch) profileJson.batch = batch;
        fs.writeFileSync(path.join(urlDirPath, `${safeName}.json`), JSON.stringify(profileJson, null, 2));
        await seedUsers(true);
        return res.status(200).json({ success: true, message: "Scraped" });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
});

async function runBackgroundJob() {
    // Use user-defined concurrency if provided, otherwise auto-detect
    let concurrency;
    if (activeJob.concurrency) {
        concurrency = activeJob.concurrency;
        console.log(`🎚 Using user-defined concurrency: ${concurrency}`);
    } else {
        // Dynamic Concurrency: 10 for Direct URLs, 3 for Search
        const isDirectBatch = activeJob.queue.every(item => typeof item === 'object' && (item.url || item.linkedinUrl));
        concurrency = isDirectBatch ? 10 : 3;
        console.log(`🔄 Auto-detected concurrency: ${concurrency} (${isDirectBatch ? 'Direct URLs' : 'Search mode'})`);
    }

    console.log(`🚀 Starting Parallel Batch (Concurrency: ${concurrency})`);
    const limit = pLimit(concurrency);

    const tasks = activeJob.queue.map((item, index) => {
        return limit(async () => {
            if (activeJob.shouldStop) return;

            const name = typeof item === 'object' ? item.name : item;
            activeJob.currentName = `Processing: ${name}`;

            try {
                await processSingleProfile(item, activeJob.forceFallback);
                activeJob.processed++;
                activeJob.logs.unshift(`✅ Success: ${name}`);
            } catch (error) {
                activeJob.processed++;
                console.error(`❌ Error [${name}]:`, error.message);
                activeJob.failedQueue.push(item);
                activeJob.logs.unshift(`⚠ Failed: ${name} - ${error.message}`);
            }
        });
    });

    await Promise.all(tasks);

    // Final Sync
    if (activeJob.processed > 0) {
        try {
            await seedUsers(true);
            activeJob.logs.unshift("💾 Database Synced.");
        } catch (error) {
            console.error("DB Sync Error:", error.message);
        }
    }

    activeJob.isRunning = false;
    activeJob.currentName = "Completed";

    if (activeJob.failedQueue.length > 0) {
        activeJob.logs.unshift(`🏁 Done. ${activeJob.failedQueue.length} items failed.`);
    } else {
        activeJob.logs.unshift("🎉 Batch Finished Successfully!");
    }
}

export default router;