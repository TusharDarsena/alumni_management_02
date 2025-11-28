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
const LINKEDIN_COLLECTOR_ENDPOINT = 'https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_l1viktl72bvl7bjuj0&notify=false&include_errors=true';
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

// --- GLOBAL JOB STATE ---
let activeJob = {
    isRunning: false, total: 0, processed: 0, currentName: "",
    logs: [], queue: [], failedQueue: [], forceFallback: false, shouldStop: false
};

// --- HELPER 1: AIRTOP SEARCH (Updated) ---
async function findUrlWithAirtop(alumniName, batch) {
    console.log(`\n   [Primary] 🤖 Starting Airtop AI Search...`);
    console.log(`   [Primary] 👤 Target: "${alumniName}"${batch ? ` | Batch: ${batch}` : ''}`);
    let session;
    try {
        console.log(`   [Primary] 🔄 Creating Airtop session...`);
        session = await airtopClient.sessions.create();
        const sessionId = session.data.id;
        console.log(`   [Primary] ✅ Session created: ${sessionId}`);
        
        // FIX: Relaxed query - NO batch in search query to avoid missing results
        // We search only for Name + College, let AI filter by batch if needed
        const searchQuery = `"${alumniName}" AND ("IIIT-Naya Raipur" OR "IIITNR" OR "International Institute of Information Technology Naya Raipur") linkedin`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        console.log(`   [Primary] 🔍 Search Query: ${searchQuery}`);
        console.log(`   [Primary] 🌐 Google URL: ${googleUrl}`);

        console.log(`   [Primary] 🪟 Opening browser window...`);
        const window = await airtopClient.windows.create(sessionId, { url: googleUrl });
        const windowId = window.data.windowId;
        console.log(`   [Primary] ✅ Browser ready, querying AI...`);

        const result = await airtopClient.windows.pageQuery(sessionId, windowId, {
            prompt: `Find the LinkedIn Profile URL for "${alumniName}" from IIIT Naya Raipur.
            ${batch ? `CONTEXT: The target user is likely from the batch/year "${batch}" (e.g., Class of ${batch}).` : ""}

            Rules:
            1. Find the best matching LinkedIn profile for "${alumniName}".
            2. ${batch ? `PRIORITY: If you see multiple people with this name, pick the one matching year "${batch}".` : ""}
            3. ACCEPTANCE: If you find a matching Name + College but NO batch year is visible, ACCEPT IT (It is better to guess than to fail).
            4. Return the URL string only. If nothing found, return empty string.`,
            configuration: {
                outputSchema: {
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "type": "object",
                    "properties": { "url": { "type": "string" } },
                    "required": ["url"]
                }
            }
        });

        console.log(`   [Primary] 🧹 Terminating session...`);
        await airtopClient.sessions.terminate(sessionId);
        session = null;

        const content = JSON.parse(result.data.modelResponse);
        console.log(`   [Primary] 📦 AI Response:`, content);
        
        if (content.url && content.url.includes('linkedin.com/in/')) {
            console.log(`   [Primary] ✅ Valid LinkedIn URL found: ${content.url}`);
            return content.url;
        }
        
        console.log(`   [Primary] ❌ No valid URL in AI response`);
        return null;

    } catch (error) {
        console.log(`   [Primary] ❌ Airtop Error: ${error.message}`);
        console.log(`   [Primary] 📊 Error Stack:`, error.stack);
        if (session) {
            console.log(`   [Primary] 🧹 Cleaning up failed session...`);
            try { await airtopClient.sessions.terminate(session.data.id); } catch(e){}
        }
        return null;
    }
}

// --- HELPER 2: BRIGHTDATA SERP + AGGRESSIVE SEARCH (Fixed) ---
async function findUrlWithBrightDataFallback(alumniName, batch) {
    console.log(`\n   [Fallback] 🔄 Switching to Bright Data SERP...`);
    
    // Query: Name + College
    const query = `"${alumniName}" AND ("IIIT-Naya Raipur" OR "IIITNR" OR "International Institute of Information Technology Naya Raipur") linkedin`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&gl=in`;

    try {
        const response = await fetch(SERP_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "zone": "serp_api1",
                "url": googleSearchUrl,
                "format": "raw"
            })
        });

        if (!response.ok) throw new Error(`SERP API Error: ${response.status}`);
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        let bestMatch = null;
        let highestScore = 0;

        const batchYears = batch ? batch.split(/[-/]/).map(y => y.trim()) : [];
        const allLinks = $('a');
        console.log(`   [Fallback] 🔎 Scanning ${allLinks.length} links for candidates...`);

        let candidateCount = 0;
        allLinks.each((i, el) => {
            const link = $(el).attr('href');
            const title = $(el).find('h3').text() || $(el).text(); 
            const snippet = $(el).parent().text().toLowerCase();

            if (!link || !title) return;
            if (!link.includes("linkedin.com/in/")) return;
            if (link.includes("/posts/") || link.includes("/jobs/") || link.includes("/company/")) return;

            // --- SCORING LOGIC ---
            const cleanTitle = title.toLowerCase().replace("linkedin", "").replace(" - ", " ").trim();
            const cleanName = alumniName.toLowerCase().trim();
            const similarity = getSimilarity(cleanTitle, cleanName);
            const isNameInTitle = cleanTitle.includes(cleanName);
            
            // Filter: Must have some name resemblance
            if (!isNameInTitle && similarity < 0.5) return;

            candidateCount++;

            // FIX: Start LOW (0.5). 
            let score = isNameInTitle ? 0.5 : 0.3; 
            let baseScore = score;

            // 1. College Boost
            const hasCollege = snippet.includes("iiitnr") || 
                               snippet.includes("naya raipur") || 
                               snippet.includes("iiit-nr") ||
                               snippet.includes("iiit - naya raipur");
            
            if (hasCollege) score += 0.4; 

            // 2. Batch Boost
            let batchBonus = 0;
            if (batchYears.length > 0) {
                batchYears.forEach(year => {
                    if (snippet.includes(year)) batchBonus = 0.3; 
                });
                score += batchBonus; 
            }

            // Log good candidates for debugging
            if (score >= 0.5) {
                console.log(`\n      [${candidateCount}] 📋 Candidate: "${cleanTitle.substring(0, 40)}..."`);
                console.log(`      [${candidateCount}] 🔗 Link: ${link.substring(0, 60)}...`);
                console.log(`      [${candidateCount}] 🎯 Score: ${(score*100).toFixed(0)}% (Base:${(baseScore*100).toFixed(0)}% + College:${hasCollege?40:0}% + Batch:${(batchBonus*100).toFixed(0)}%)`);
            }

            // Save best
            if (score > highestScore) {
                highestScore = score;
                bestMatch = link;
            }
        });

        console.log(`\n   [Fallback] 📊 Analysis Complete: ${candidateCount} candidates evaluated`);
        
        // --- CRITICAL UPDATE: LOWER THRESHOLD TO 0.45 ---
        // This allows "Name Only" (0.5) to pass.
        // We rely on the scraping step to validate the education.
        if (bestMatch && highestScore >= 0.45) {
            console.log(`   [Fallback] ✅ MATCH FOUND!`);
            console.log(`   [Fallback] 🔗 URL: ${bestMatch}`);
            console.log(`   [Fallback] 🎯 Confidence Score: ${(highestScore*100).toFixed(0)}%`);
            return bestMatch;
        }

        console.log(`   [Fallback] ❌ No confident match found`);
        console.log(`   [Fallback] 📉 Highest Score: ${(highestScore*100).toFixed(0)}% (Required: 45%)`);
        return null;

    } catch (error) {
        console.log(`   [Fallback] ❌ SERP Error: ${error.message}`);
        return null;
    }
}

// --- MAIN PROCESSOR (Accepts Object with name and batch) ---
async function processSingleProfile(profileData, forceFallback = false) {
    // profileData can be a string (old way) or object {name, batch} (new way)
    const alumniName = typeof profileData === 'object' ? profileData.name : profileData;
    const batch = typeof profileData === 'object' ? profileData.batch : "";

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 PROCESSING PROFILE`);
    console.log(`   👤 Name: ${alumniName}`);
    console.log(`   📅 Batch: ${batch || "Any"}`);
    console.log(`   🔄 Mode: ${forceFallback ? 'FALLBACK (Bright Data)' : 'PRIMARY (Airtop AI)'}`);
    console.log(`${'='.repeat(80)}`);
    
    let foundUrl = null;

    if (forceFallback) {
        console.log(`\n🔄 STEP 1: URL Discovery (Fallback Mode)`);
        foundUrl = await findUrlWithBrightDataFallback(alumniName, batch);
        if (!foundUrl) {
            console.log(`\n❌ FAILED: Fallback could not find confident match`);
            throw new Error("Fallback: No confident match found (College/Batch mismatch).");
        }
    } else {
        console.log(`\n🔄 STEP 1: URL Discovery (Primary Mode)`);
        foundUrl = await findUrlWithAirtop(alumniName, batch);
        if (!foundUrl) {
            console.log(`\n❌ FAILED: Airtop could not find URL`);
            const err = new Error("Airtop could not find URL.");
            err.code = "AIRTOP_FAILED";
            throw err;
        }
    }

    console.log(`\n✅ STEP 1 COMPLETE: Profile URL Found`);
    console.log(`   🔗 ${foundUrl}`);

    // STEP 2: SCRAPE DATA
    console.log(`\n🔄 STEP 2: Scraping Full Profile Data from LinkedIn`);
    console.log(`   📡 Calling Bright Data Collector API...`);
    console.log(`   🔗 Target URL: ${foundUrl}`);
    
    const linkedinResponse = await fetch(LINKEDIN_COLLECTOR_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "url": foundUrl })
    });

    if (!linkedinResponse.ok) {
        console.log(`   ❌ Bright Data Collector Error: ${linkedinResponse.status}`);
        throw new Error(`Bright Data Collector failed with status ${linkedinResponse.status}`);
    }

    console.log(`   ✅ Profile data received`);
    const rawText = await linkedinResponse.text();
    console.log(`   📦 Response size: ${rawText.length} characters`);
    
    const profileJson = JSON.parse(rawText);
    console.log(`   ✅ JSON parsed successfully`);

    // ==================================================================
    // 🚨 STEP 3: CONDITIONAL VALIDATION 🚨
    // Fallback = STRICT (Must verify IIITNR)
    // Airtop   = LENIENT (Trust the AI, even if Education is empty)
    // ==================================================================
    console.log(`\n🛡️ STEP 3: Validating University in Scraped Data...`);
    
    const educationList = profileJson.education || [];
    let isIIITNR = false;
    const validKeywords = ["iiitnr", "iiit - naya raipur", "international institute of information technology", "naya raipur", "iiit-nr"];

    educationList.forEach(edu => {
        const schoolName = (
            edu.school || 
            edu.school_name || 
            edu.name || 
            edu.institute_name || 
            edu.institution_name || 
            edu.title || 
            ""
        ).toLowerCase();

        const description = (edu.description || "").toLowerCase(); 
        
        if (validKeywords.some(key => schoolName.includes(key) || description.includes(key))) {
            isIIITNR = true;
            console.log(`   ✅ Verified Education: ${schoolName}`);
        }
    });

    if (!isIIITNR) {
        console.log(`   ⚠️ VALIDATION FAILED: Profile scraped, but no IIITNR education found.`);
        
        if (forceFallback) {
            // STRICT MODE: If we used Fallback (Regex), we MUST verify. 
            // If verification fails, we assume it's a False Positive (like Saswat from OP Jindal).
            console.log(`   ❌ BLOCKING SAVE: In Fallback mode, verification is mandatory.`);
            throw new Error("Validation Failed: Profile scraped, but user did not study at IIITNR.");
        } else {
            // LENIENT MODE: If we used Airtop (AI), we trust the search result.
            // We save the profile even if the Education section is hidden/empty.
            console.log(`   ⚠️ ALLOWING SAVE: In Airtop mode, we trust the AI match despite missing verification.`);
        }
    } else {
        console.log(`   ✅ Validation Passed: User studied at IIITNR.`);
    }
    // ==================================================================

    // STEP 4: SAVE TO FILE
    console.log(`\n🔄 STEP 4: Saving Profile Data`);
    const urlDirPath = path.join(__dirname, '../../client/data/alumnidata');
    if (!fs.existsSync(urlDirPath)) {
        console.log(`   📁 Creating directory: ${urlDirPath}`);
        fs.mkdirSync(urlDirPath, { recursive: true });
    }
    
    const safeName = alumniName.toLowerCase().replace(/ /g, '_');
    
    // Save URL text
    const urlFilePath = path.join(urlDirPath, `${safeName}_linkedin_url.txt`);
    fs.writeFileSync(urlFilePath, foundUrl);
    console.log(`   ✅ URL saved: ${urlFilePath}`);

    // Save JSON (Add batch tag)
    if (batch) profileJson.batch = batch;
    const jsonFilePath = path.join(urlDirPath, `${safeName}.json`);
    fs.writeFileSync(jsonFilePath, JSON.stringify(profileJson, null, 2));
    console.log(`   ✅ Profile saved: ${jsonFilePath}`);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 SUCCESS: ${alumniName} - Profile fully scraped and saved!`);
    console.log(`${'='.repeat(80)}\n`);
    
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
        return res.status(200).json({ success: true, message: `Scraped ${alumniName}` });
    } catch (error) {
        if (error.code === 'AIRTOP_FAILED') {
            return res.status(422).json({ success: false, code: 'AIRTOP_FAILED', message: 'Airtop failed.' });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
});

async function runBackgroundJob() {
    console.log(`🚀 Starting Parallel Batch (Limit: 3 concurrent tasks)...`);
    console.log(`📊 Total profiles to process: ${activeJob.queue.length}`);
    console.log(`🔄 Mode: ${activeJob.forceFallback ? 'FALLBACK (Bright Data)' : 'PRIMARY (Airtop AI)'}`);
    
    // 1. Create a limiter that only allows 3 promises to run at once
    // We choose 3 because Airtop Free/Starter allows max 3 sessions.
    const limit = pLimit(3);
    
    // 2. Map every profile to a limited promise
    const tasks = activeJob.queue.map((item, index) => {
        return limit(async () => {
            if (activeJob.shouldStop) {
                console.log(`⏸️ Stop signal received, skipping remaining tasks...`);
                return;
            }

            const name = typeof item === 'object' ? item.name : item;
            
            // Update status (approximate since they run in parallel)
            activeJob.currentName = `Processing: ${name}`;
            
            try {
                await processSingleProfile(item, activeJob.forceFallback);
                activeJob.processed++;
                activeJob.logs.unshift(`✅ Success: ${name}`);
                console.log(`📊 Progress: ${activeJob.processed}/${activeJob.total} completed`);
            } catch (error) {
                activeJob.processed++;
                console.error(`❌ Error [${name}]:`, error.message);
                activeJob.failedQueue.push(item);
                activeJob.logs.unshift(`⚠️ Failed: ${name} - ${error.message}`);
            }
        });
    });

    // 3. Wait for ALL of them to finish
    console.log(`⏳ Waiting for all parallel tasks to complete...`);
    await Promise.all(tasks);

    // 4. Sync Database ONCE at the end
    if (activeJob.processed > 0) {
        console.log(`\n🔄 Batch complete. Syncing ${activeJob.processed} profiles to Database...`);
        try {
            activeJob.currentName = "Syncing Database...";
            await seedUsers(true);
            activeJob.logs.unshift("💾 Database Synced Successfully.");
            console.log(`✅ Database updated successfully with all profiles`);
        } catch (error) {
            console.error("❌ Database seeding error:", error.message);
            activeJob.logs.unshift("⚠️ Data saved to JSON, but Database Sync failed.");
        }
    }

    activeJob.isRunning = false;
    activeJob.currentName = "Completed";
    
    if (activeJob.failedQueue.length > 0) {
        activeJob.logs.unshift(`🏁 Parallel Batch Done. ${activeJob.failedQueue.length} items failed.`);
    } else {
        activeJob.logs.unshift("🎉 Parallel Batch Scraping Finished Successfully!");
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 PARALLEL BATCH COMPLETE`);
    console.log(`   ✅ Successful: ${activeJob.processed - activeJob.failedQueue.length}`);
    console.log(`   ❌ Failed: ${activeJob.failedQueue.length}`);
    console.log(`   📊 Total: ${activeJob.total}`);
    console.log(`${'='.repeat(80)}\n`);
}

export default router;