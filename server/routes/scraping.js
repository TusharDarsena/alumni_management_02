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
// 1. Trigger Endpoint
const TRIGGER_ENDPOINT = `${BRIGHTDATA_API_BASE}/trigger?dataset_id=${DATASET_ID}&include_errors=true`;
// 2. Progress Endpoint (from your docs)
const PROGRESS_ENDPOINT = `${BRIGHTDATA_API_BASE}/progress`;
// 3. Download Endpoint
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

// --- UTILITY: BRIGHT DATA POLLING HELPER (THE FIX) ---
async function scrapeWithBrightData(url) {
    console.log(`   📡 Triggering Bright Data Collector...`);
    
    // 1. Trigger the Job
    const triggerResponse = await fetch(TRIGGER_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ "url": url }]) // Sending as array is often safer for batch APIs
    });

    if (!triggerResponse.ok) {
        throw new Error(`Bright Data Trigger Failed: ${triggerResponse.status}`);
    }

    const triggerData = await triggerResponse.json();
    
    // Check if we got a Snapshot ID (Asynchronous flow)
    if (!triggerData.snapshot_id) {
        // Rare case: Sync response (Direct data)
        console.log("   ⚡ Received immediate data (Sync mode)");
        return Array.isArray(triggerData) ? triggerData[0] : triggerData;
    }

    const snapshotId = triggerData.snapshot_id;
    console.log(`   ⏳ Job Queued. Snapshot ID: ${snapshotId}`);

    // 2. Poll for Progress
    let isReady = false;
    let attempts = 0;
    
    while (!isReady) {
        // Wait 10 seconds between checks
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;

        console.log(`   🔎 Checking status (${attempts * 10}s elapsed)...`);
        
        const progressResponse = await fetch(`${PROGRESS_ENDPOINT}/${snapshotId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${BRIGHTDATA_API_KEY}` }
        });

        if (!progressResponse.ok) {
            console.log(`   ⚠️ Progress check failed (${progressResponse.status}). Retrying...`);
            continue;
        }

        const progressData = await progressResponse.json();
        const status = progressData.status; // 'running', 'ready', 'failed'

        if (status === 'ready') {
            console.log(`   ✅ Job Finished! Downloading data...`);
            isReady = true;
        } else if (status === 'failed') {
            throw new Error("Bright Data reported the scraping job FAILED.");
        } else {
            console.log(`   ⏳ Status: ${status} (Still processing...)`);
        }
    }

    // 3. Download the Result
    const downloadResponse = await fetch(`${SNAPSHOT_ENDPOINT}/${snapshotId}?format=json`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${BRIGHTDATA_API_KEY}` }
    });

    if (!downloadResponse.ok) {
        throw new Error(`Failed to download snapshot: ${downloadResponse.status}`);
    }

    const finalData = await downloadResponse.json();
    
    // Bright Data returns an array of results. We sent 1 URL, so we want the first item.
    if (Array.isArray(finalData) && finalData.length > 0) {
        return finalData[0];
    } else if (Array.isArray(finalData) && finalData.length === 0) {
        throw new Error("Bright Data finished but returned NO data (Empty Array).");
    }

    return finalData;
}

// --- GLOBAL JOB STATE ---
let activeJob = {
    isRunning: false, total: 0, processed: 0, currentName: "",
    logs: [], queue: [], failedQueue: [], forceFallback: false, shouldStop: false
};

// --- HELPER 1: AIRTOP SEARCH ---
async function findUrlWithAirtop(alumniName, batch) {
    console.log(`\n   [Primary] 🤖 Starting Airtop AI Search...`);
    let session;
    try {
        session = await airtopClient.sessions.create();
        const sessionId = session.data.id;
        
        const searchQuery = `"${alumniName}" AND ("IIIT-Naya Raipur" OR "IIITNR" OR "International Institute of Information Technology Naya Raipur") linkedin`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

        const window = await airtopClient.windows.create(sessionId, { url: googleUrl });
        const windowId = window.data.windowId;

        const result = await airtopClient.windows.pageQuery(sessionId, windowId, {
            prompt: `Find the LinkedIn Profile URL for "${alumniName}" from IIIT Naya Raipur.
            ${batch ? `CONTEXT: The target user is likely from the batch/year "${batch}".` : ""}

            Rules:
            1. Find the best matching LinkedIn profile.
            2. ${batch ? `PRIORITY: Pick the one matching year "${batch}".` : ""}
            3. ACCEPTANCE: If matching Name + College found but NO batch visible, ACCEPT IT.
            4. Return the URL string only.`,
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
            return content.url;
        }
        return null;

    } catch (error) {
        console.log(`   [Primary] ❌ Airtop Error: ${error.message}`);
        if (session) try { await airtopClient.sessions.terminate(session.data.id); } catch(e){}
        return null;
    }
}

// --- HELPER 2: BRIGHTDATA SERP ---
async function findUrlWithBrightDataFallback(alumniName, batch) {
    console.log(`\n   [Fallback] 🔄 Switching to Bright Data SERP...`);
    const query = `"${alumniName}" AND ("IIIT-Naya Raipur" OR "IIITNR" OR "International Institute of Information Technology Naya Raipur") linkedin`;
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

// --- MAIN PROCESSOR ---
async function processSingleProfile(profileData, forceFallback = false) {
    const alumniName = typeof profileData === 'object' ? profileData.name : profileData;
    const batch = typeof profileData === 'object' ? profileData.batch : "";
    const directUrl = typeof profileData === 'object' ? (profileData.url || profileData.linkedinUrl) : null;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 PROCESSING PROFILE: ${alumniName}`);
    
    let foundUrl = null;

    // STEP 1: FIND URL
    if (directUrl) {
        console.log(`   🔗 Direct URL: ${directUrl}`);
        foundUrl = directUrl;
    } else if (forceFallback) {
        foundUrl = await findUrlWithBrightDataFallback(alumniName, batch);
        if (!foundUrl) throw new Error("Fallback: No confident match found.");
    } else {
        foundUrl = await findUrlWithAirtop(alumniName, batch);
        if (!foundUrl) {
            const err = new Error("Airtop could not find URL.");
            err.code = "AIRTOP_FAILED";
            throw err;
        }
    }

    // STEP 2: SCRAPE DATA (WITH NEW POLLING)
    console.log(`\n🔄 STEP 2: Scraping Full Profile (Async Mode)...`);
    
    // Call the new helper function
    const profileJson = await scrapeWithBrightData(foundUrl);
    
    console.log(`   ✅ JSON received successfully`);

    // STEP 3: VALIDATION
    console.log(`\n🛡️ STEP 3: Validating...`);
    const educationList = profileJson.education || [];
    let isIIITNR = false;
    const validKeywords = ["iiitnr", "iiit - naya raipur", "international institute of information technology", "naya raipur", "iiit-nr"];

    educationList.forEach(edu => {
        const schoolName = (edu.school || edu.school_name || edu.name || "").toLowerCase();
        if (validKeywords.some(key => schoolName.includes(key))) isIIITNR = true;
    });

    if (!isIIITNR) {
        console.log(`   ⚠️ VALIDATION WARNING: No IIITNR education found.`);
        if (forceFallback) {
            throw new Error("Validation Failed: Profile scraped, but user did not study at IIITNR.");
        }
    } else {
        console.log(`   ✅ Validation Passed.`);
    }

    // STEP 4: SAVE
    console.log(`\n🔄 STEP 4: Saving Data`);
    const urlDirPath = path.join(__dirname, '../../client/data/alumnidata');
    if (!fs.existsSync(urlDirPath)) fs.mkdirSync(urlDirPath, { recursive: true });
    
    const safeName = alumniName.toLowerCase().replace(/ /g, '_');
    fs.writeFileSync(path.join(urlDirPath, `${safeName}_linkedin_url.txt`), foundUrl);
    if (batch) profileJson.batch = batch;
    
    // Save JSON only when we actually have data
    fs.writeFileSync(path.join(urlDirPath, `${safeName}.json`), JSON.stringify(profileJson, null, 2));
    
    // Note: Database sync is now handled by the caller (batch or route handler)
    // to avoid excessive DB writes during bulk operations.

    return "Success";
}

// --- ROUTES ---

router.post('/start-batch', async (req, res) => {
    const { profiles, forceFallback } = req.body; 
    if (!profiles || !Array.isArray(profiles)) return res.status(400).json({ message: "Profiles array required" });
    if (activeJob.isRunning) return res.status(409).json({ message: "Job already running" });

    activeJob = {
        isRunning: true, total: profiles.length, processed: 0,
        currentName: "Initializing...", logs: [], queue: profiles,
        failedQueue: [], forceFallback: !!forceFallback, shouldStop: false
    };

    res.json({ success: true, message: "Batch started" });
    runBackgroundJob();
});

router.get('/status', (req, res) => { res.json(activeJob); });

router.post('/stop-batch', (req, res) => {
    activeJob.shouldStop = true;
    activeJob.logs.unshift("⚠️ Stop requested by user...");
    res.json({ success: true });
});

router.post('/get-linkedin-profile', async (req, res) => {
    const { alumniName, batch, forceFallback } = req.body;
    if (!alumniName) return res.status(400).json({ message: 'Name required' });

    try {
        await processSingleProfile({ name: alumniName, batch }, forceFallback);
        // Sync DB for single profile request
        await seedUsers(true);
        return res.status(200).json({ success: true, message: `Scraped ${alumniName}` });
    } catch (error) {
        if (error.code === 'AIRTOP_FAILED') {
            return res.status(422).json({ success: false, code: 'AIRTOP_FAILED', message: 'Airtop failed.' });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/direct-profile', async (req, res) => {
    const { linkedinUrl, name, batch } = req.body;
    try {
        const profileJson = await scrapeWithBrightData(linkedinUrl);
        // Save logic repeated for direct
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
    // Dynamic Concurrency: 10 for Direct URLS, 3 for Search
    const isDirectBatch = activeJob.queue.every(item => typeof item === 'object' && (item.url || item.linkedinUrl));
    const concurrency = isDirectBatch ? 10 : 3;
    
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
                activeJob.logs.unshift(`⚠️ Failed: ${name} - ${error.message}`);
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