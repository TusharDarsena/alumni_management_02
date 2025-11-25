import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedUsers } from '../scripts/seedUser.js';
import { AirtopClient } from '@airtop/sdk';
import * as cheerio from 'cheerio'; // <--- NEW IMPORT

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- CONFIGURATION ---
const LINKEDIN_COLLECTOR_ENDPOINT = 'https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_l1viktl72bvl7bjuj0&notify=false&include_errors=true';
const SERP_API_ENDPOINT = 'https://api.brightdata.com/request';
const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY;
const AIRTOP_API_KEY = process.env.AIRTOP_API_KEY;

// Initialize Airtop
const airtopClient = new AirtopClient({ apiKey: AIRTOP_API_KEY });

// --- UTILITY: FUZZY STRING MATCHING (Lightweight NLP) ---
// This checks how similar two strings are (0 to 1). 
// 1 = Exact Match, 0 = Completely Different.
function getSimilarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
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

// --- GLOBAL JOB STATE (In-Memory) ---
let activeJob = {
    isRunning: false,
    total: 0,
    processed: 0,
    currentName: "",
    logs: [],
    queue: [], // Now stores objects: { name: "Lakshya", batch: "2021-2025" }
    failedQueue: [], // <--- NEW: Stores profile objects that failed Pass 1
    forceFallback: false, // <--- NEW: Remember if this batch is a retry
    shouldStop: false
};

// --- HELPER 1: AIRTOP SEARCH (Updated for Batch) ---
async function findUrlWithAirtop(alumniName, batch) {
    console.log(`   [Primary] Trying Airtop AI Search...`);
    let session;
    try {
        session = await airtopClient.sessions.create();
        const sessionId = session.data.id;
        
        // --- NEW SEARCH LOGIC ---
        // If batch is present, force Google to find that specific year string
        const batchQuery = batch ? `"${batch}"` : ""; 
        const searchQuery = `"${alumniName}" AND ("IIIT-Naya Raipur" OR "IIITNR") ${batchQuery}`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

        const window = await airtopClient.windows.create(sessionId, { url: googleUrl });
        const windowId = window.data.windowId;

        const result = await airtopClient.windows.pageQuery(sessionId, windowId, {
            prompt: `Analyze the Google Search results. Find the LinkedIn profile URL for "${alumniName}" who studied at IIIT Naya Raipur.
            
            ${batch ? `CONTEXT: The user specifically requested the Batch of "${batch}".` : ""}

            Rules:
            1. Ignore generic profiles, directory lists, or social media like Facebook/Instagram.
            2. Look for the most likely match based on the name and university.
            3. Return the direct profile URL (e.g., https://www.linkedin.com/in/username).
            
            // DYNAMIC RULE 4: The Smartest Part
            // If batch exists -> Be Strict. 
            // If no batch -> Use the old "Best Guess" logic.
            4. ${batch 
                ? `CRITICAL VERIFICATION: You MUST prioritize the profile that mentions the years "${batch}" (or overlapping years). If a profile has the right name but the wrong batch year, DO NOT select it.` 
                : `If multiple similar names exist, prefer the one mentioning "IIIT Naya Raipur" or "Student" or "Alumni".`
            }

            5. If absolutely no valid profile is found, return empty string for url.`,
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
        console.log(`   [Primary] Airtop failed: ${error.message}`);
        if (session) try { await airtopClient.sessions.terminate(session.data.id); } catch(e){}
        return null;
    }
}

// --- HELPER 2: BRIGHTDATA SERP + CHEERIO (Updated for Batch) ---
async function findUrlWithBrightDataFallback(alumniName, batch) {
    console.log(`   [Fallback] Switching to Bright Data SERP (HTML + Smart Check)...`);
    
    // --- NEW SEARCH LOGIC ---
    const batchQuery = batch ? `"${batch}"` : "";
    const query = `"${alumniName}" AND ("IIIT-Naya Raipur" OR "IIITNR" OR "International Institute of Information Technology Naya Raipur") linkedin ${batchQuery}`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&gl=in`;

    try {
        // Request RAW HTML (Always reliable)
        const response = await fetch(SERP_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "zone": "serp_api1",
                "url": googleSearchUrl,
                "format": "raw" // <--- Changed back to raw
            })
        });

        if (!response.ok) throw new Error(`SERP API Error: ${response.status}`);
        const html = await response.text();

        // 2. Parse HTML with Cheerio (Like jQuery for Node.js)
        const $ = cheerio.load(html);
        let bestMatch = null;
        let highestScore = 0;

        console.log("   [Fallback] Parsing Search Results...");

        // Loop through standard Google Search Result blocks
        // BrightData/Google often uses class 'g' or 'MjjYud' for result containers
        // We look for 'a' tags that contain 'h3' (titles) inside
        
        $('a').each((i, el) => {
            const link = $(el).attr('href');
            const title = $(el).find('h3').text() || $(el).text(); // Try to get h3, else get full text

            if (!link || !title) return;

            // Basic Link Filters
            if (!link.includes("linkedin.com/in/")) return;
            if (link.includes("/posts/") || link.includes("/jobs/") || link.includes("/company/")) return;

            // 3. FUZZY NAME MATCHING
            // Compare the Google Title with the Alumni Name
            const cleanTitle = title.toLowerCase().replace("linkedin", "").replace(" - ", " ").trim();
            const cleanName = alumniName.toLowerCase().trim();
            
            const similarity = getSimilarity(cleanTitle, cleanName);
            const isNameInTitle = cleanTitle.includes(cleanName);

            // Log analysis for debugging
            console.log(`      > Found: "${title.substring(0, 40)}..." | Score: ${(similarity*100).toFixed(0)}%`);

            // 4. THRESHOLD CHECK
            // If name is strictly inside title OR similarity > 60%
            if (isNameInTitle || similarity > 0.6) {
                // If this is better than previous matches, keep it
                if (similarity > highestScore) {
                    highestScore = similarity;
                    bestMatch = link;
                }
            }
        });

        if (bestMatch) {
            console.log(`   [Fallback] ✅ Verified Match: ${bestMatch} (Score: ${(highestScore*100).toFixed(0)}%)`);
            return bestMatch;
        }

        console.log("   [Fallback] ❌ No result passed the name confidence check.");
        return null;

    } catch (error) {
        console.log(`   [Fallback] SERP failed: ${error.message}`);
        return null;
    }
}

// --- MAIN PROCESSOR (Accepts Object with name and batch) ---
async function processSingleProfile(profileData, forceFallback = false) {
    // profileData can be a string (old way) or object {name, batch} (new way)
    const alumniName = typeof profileData === 'object' ? profileData.name : profileData;
    const batch = typeof profileData === 'object' ? profileData.batch : "";

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${alumniName} [Batch: ${batch || "Any"}] (Fallback: ${forceFallback})`);
    
    let foundUrl = null;

    // 1. Decide method
    if (forceFallback) {
        foundUrl = await findUrlWithBrightDataFallback(alumniName, batch);
        if (!foundUrl) throw new Error("Fallback: No confident match found.");
    } else {
        foundUrl = await findUrlWithAirtop(alumniName, batch);
        if (!foundUrl) {
            // THROW SPECIFIC ERROR FOR FRONTEND
            const err = new Error("Airtop could not find URL.");
            err.code = "AIRTOP_FAILED";
            throw err;
        }
    }

    console.log(`✓ Final URL to Scrape: ${foundUrl}`);

    // 2. Save URL
    const urlDirPath = path.join(__dirname, '../../client/data/alumnidata');
    if (!fs.existsSync(urlDirPath)) fs.mkdirSync(urlDirPath, { recursive: true });
    const safeName = alumniName.toLowerCase().replace(/ /g, '_');
    fs.writeFileSync(path.join(urlDirPath, `${safeName}_linkedin_url.txt`), foundUrl);

    // 3. Scrape Profile
    console.log('   Scraping Profile Data...');
    const linkedinResponse = await fetch(LINKEDIN_COLLECTOR_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "url": foundUrl })
    });

    if (!linkedinResponse.ok) {
        const errText = await linkedinResponse.text();
        throw new Error(`Bright Data Collector failed: ${errText}`);
    }

    const rawText = await linkedinResponse.text();
    const profileJson = JSON.parse(rawText);

    // 4. Save & Seed
    fs.writeFileSync(path.join(urlDirPath, `${safeName}.json`), JSON.stringify(profileJson, null, 2));
    await seedUsers(true);
    
    return "Success";
}


// --- API ENDPOINT 1: Start Batch ---
router.post('/start-batch', async (req, res) => {
    // profiles is now expected to be: [{ name: "X", batch: "2021-2025" }, ...]
    const { profiles, forceFallback } = req.body; 
    
    if (!profiles || !Array.isArray(profiles)) {
        return res.status(400).json({ message: "Profiles array required" });
    }

    if (activeJob.isRunning) {
        return res.status(409).json({ message: "Job already running" });
    }

    // Reset State
    activeJob = {
        isRunning: true,
        total: profiles.length,
        processed: 0,
        currentName: "Initializing...",
        logs: [],
        queue: profiles, // Queue now holds objects
        failedQueue: [], // Start clean
        forceFallback: !!forceFallback, // Set the mode
        shouldStop: false
    };

    res.json({ success: true, message: "Batch started" });

    // Start Background Loop
    runBackgroundJob();
});

// --- API ENDPOINT 2: Get Status (Polling) ---
router.get('/status', (req, res) => {
    res.json(activeJob);
});

// --- API ENDPOINT 3: Stop Job ---
router.post('/stop-batch', (req, res) => {
    activeJob.shouldStop = true;
    activeJob.logs.unshift("⚠️ Stop requested by user...");
    res.json({ success: true });
});

// --- BACKGROUND WORKER (Updated for Queue Logic) ---
async function runBackgroundJob() {
    console.log(`Starting background batch (Fallback Mode: ${activeJob.forceFallback})...`);
    
    for (let i = 0; i < activeJob.queue.length; i++) {
        if (activeJob.shouldStop) {
            activeJob.isRunning = false;
            activeJob.currentName = "Stopped";
            activeJob.logs.unshift("🛑 Batch stopped by user.");
            return;
        }

        const item = activeJob.queue[i];
        const name = typeof item === 'object' ? item.name : item;
        
        activeJob.currentName = name;
        activeJob.processed = i; 
        
        try {
            // Pass the global forceFallback setting to the processor
            await processSingleProfile(item, activeJob.forceFallback);
            activeJob.logs.unshift(`✅ Success: ${name}`);
        } catch (error) {
            console.error(`Batch Error [${name}]:`, error.message);
            
            // ADD TO FAILED QUEUE (Don't stop!) - Add entire object back for retry
            activeJob.failedQueue.push(item);
            activeJob.logs.unshift(`⚠️ Skipped: ${name} (Added to Retry Queue)`);
        }
    }

    activeJob.processed = activeJob.total;
    activeJob.isRunning = false;
    activeJob.currentName = "Completed";
    
    if (activeJob.failedQueue.length > 0) {
        activeJob.logs.unshift(`🏁 Batch Done. ${activeJob.failedQueue.length} items failed.`);
    } else {
        activeJob.logs.unshift("🎉 Batch Scraping Finished Successfully!");
    }
}

router.post('/get-linkedin-profile', async (req, res) => {
    const { alumniName, batch, forceFallback } = req.body; // Accept batch here too
    
    if (!alumniName) return res.status(400).json({ message: 'Name required' });

    try {
        await processSingleProfile({ name: alumniName, batch }, forceFallback);
        return res.status(200).json({ success: true, message: `Scraped ${alumniName}` });
    } catch (error) {
        // Send specific error code to frontend
        if (error.code === 'AIRTOP_FAILED') {
            return res.status(422).json({ 
                success: false, 
                code: 'AIRTOP_FAILED',
                message: 'Airtop could not find the profile.' 
            });
        }
        
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

export default router;