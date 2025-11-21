import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedUsers } from '../scripts/seedUser.js';
import { AirtopClient } from '@airtop/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- CONFIGURATION ---
const LINKEDIN_COLLECTOR_ENDPOINT = 'https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_l1viktl72bvl7bjuj0&notify=false&include_errors=true';
const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY;
const AIRTOP_API_KEY = process.env.AIRTOP_API_KEY;

// Initialize Airtop
const airtopClient = new AirtopClient({ apiKey: AIRTOP_API_KEY });

// Airtop JSON Schema (Forces AI to give us a clean URL)
const jsonSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "url": {
            "type": "string",
            "description": "The final, validated LinkedIn profile URL. Must start with https://www.linkedin.com/in/"
        },
        "error": {
            "type": "string",
            "description": "Reason if no valid profile is found."
        }
    },
    "required": ["url"]
};

// --- GLOBAL JOB STATE (In-Memory) ---
let activeJob = {
    isRunning: false,
    total: 0,
    processed: 0,
    currentName: "",
    logs: [],
    queue: [],
    shouldStop: false
};

// --- HELPER: The Combined Workflow (Airtop Search -> BrightData Scrape) ---
async function processSingleProfile(alumniName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${alumniName}`);
    
    let session; // Keep track of session to close it later
    let foundUrl = null;

    try {
        // ============================================================
        // STEP 1: SEARCH using AIRTOP (AI-based URL Extraction)
        // ============================================================
        console.log('[STEP 1] Initializing Airtop Session...');
        
        session = await airtopClient.sessions.create();
        const sessionId = session.data.id;
        
        // specific search query for IIIT Naya Raipur alumni
        const searchQuery = `"${alumniName}" AND ("IIIT-Naya Raipur" OR "IIITNR" OR "International Institute of Information Technology Naya Raipur")`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

        console.log(`[STEP 1.1] Searching Google via Airtop...`);
        const window = await airtopClient.windows.create(sessionId, { url: googleUrl });
        const windowId = window.data.windowId;

        console.log('[STEP 1.2] Analyzing search results with AI...');
        
        // We optimized the prompt to focus ONLY on the URL, as BrightData will get the rest.
        const result = await airtopClient.windows.pageQuery(sessionId, windowId, {
            prompt: `Analyze the Google Search results. Find the LinkedIn profile URL for "${alumniName}" who studied at IIIT Naya Raipur.
            
            Rules:
            1. Ignore generic profiles or directory lists.
            2. Look for the most likely match based on the name and university.
            3. Return the direct profile URL (e.g., https://www.linkedin.com/in/username).
            4. If multiple similar names exist, prefer the one mentioning "IIIT Naya Raipur" or "Student" or "Alumni".
            5. If absolutely no valid profile is found, return empty string for url.`,
            configuration: {
                outputSchema: jsonSchema,
            },
        });

        const content = JSON.parse(result.data.modelResponse);

        // Close Airtop session immediately to save credits/resources
        await airtopClient.sessions.terminate(sessionId);
        session = null; 

        if (content.error || !content.url || content.url === "") {
            throw new Error(`Airtop could not find profile: ${content.error || "No URL returned"}`);
        }

        foundUrl = content.url;
        console.log(`✓ Airtop Found URL: ${foundUrl}`);

        // ============================================================
        // STEP 2: SAVE URL LOCALLY
        // ============================================================
        console.log('\n[STEP 2] Saving URL...');
        const urlDirPath = path.join(__dirname, '../../client/data/alumnidata');
        if (!fs.existsSync(urlDirPath)) {
            fs.mkdirSync(urlDirPath, { recursive: true });
        }
        const urlFileName = `${alumniName.toLowerCase().replace(/ /g, '_')}_linkedin_url.txt`;
        fs.writeFileSync(path.join(urlDirPath, urlFileName), foundUrl);

        // ============================================================
        // STEP 3: SCRAPE PROFILE using BRIGHT DATA (Deep Scrape)
        // ============================================================
        console.log('\n[STEP 3] Scraping Full Profile via Bright Data...');

        const linkedinResponse = await fetch(LINKEDIN_COLLECTOR_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "url": foundUrl })
        });

        if (!linkedinResponse.ok) {
            const errorText = await linkedinResponse.text();
            console.error(`Bright Data Error Response (${linkedinResponse.status}):`, errorText);
            throw new Error(`Bright Data scraping failed: ${linkedinResponse.status} - ${errorText}`);
        }
        
        const rawLinkedinText = await linkedinResponse.text();
        let finalProfileJson;
        try {
            finalProfileJson = JSON.parse(rawLinkedinText);
        } catch(e) {
            throw new Error('Invalid JSON from Bright Data');
        }

        // ============================================================
        // STEP 4: SAVE & SEED DATABASE
        // ============================================================
        console.log('\n[STEP 4] Saving & Seeding Database...');
        
        const profileFileName = `${alumniName.toLowerCase().replace(/ /g, '_')}.json`;
        fs.writeFileSync(path.join(urlDirPath, profileFileName), JSON.stringify(finalProfileJson, null, 2));
        
        const seedResult = await seedUsers(true);
        console.log(`✓ Database updated. Processed count: ${seedResult.count}`);
        console.log('='.repeat(60));
        
        return "Success";

    } catch (error) {
        // Cleanup Airtop if it crashed before closing
        if (session) {
            try { await airtopClient.sessions.terminate(session.data.id); } catch (e) {}
        }
        throw error; // Re-throw to be caught by the background worker
    }
}


// --- API ENDPOINT 1: Start Batch ---
router.post('/start-batch', async (req, res) => {
    const { names } = req.body;
    if (!names || !Array.isArray(names)) {
        return res.status(400).json({ message: "Names array required" });
    }

    if (activeJob.isRunning) {
        return res.status(409).json({ message: "Job already running" });
    }

    // Reset State
    activeJob = {
        isRunning: true,
        total: names.length,
        processed: 0,
        currentName: "Initializing...",
        logs: [],
        queue: names,
        shouldStop: false
    };

    res.json({ success: true, message: "Batch started in background" });

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

// --- BACKGROUND WORKER ---
async function runBackgroundJob() {
    console.log("Starting background batch...");
    
    for (let i = 0; i < activeJob.queue.length; i++) {
        if (activeJob.shouldStop) {
            activeJob.isRunning = false;
            activeJob.currentName = "Stopped";
            activeJob.logs.unshift("🛑 Batch stopped by user.");
            return;
        }

        const name = activeJob.queue[i];
        activeJob.currentName = name;
        activeJob.processed = i; 
        
        try {
            await processSingleProfile(name);
            activeJob.logs.unshift(`✅ Success: ${name}`);
        } catch (error) {
            console.error(`Error scraping ${name}:`, error.message);
            activeJob.logs.unshift(`❌ Failed: ${name} - ${error.message}`);
        }
    }

    activeJob.processed = activeJob.total;
    activeJob.isRunning = false;
    activeJob.currentName = "Completed";
    activeJob.logs.unshift("🎉 Batch Scraping Finished!");
}

router.post('/get-linkedin-profile', async (req, res) => {
    const { alumniName } = req.body;
    
    if (!alumniName) {
        return res.status(400).json({ message: 'Alumni name is required' });
    }

    try {
        // Reuse the same powerful Airtop function used by the batch system
        await processSingleProfile(alumniName);
        
        return res.status(200).json({ 
            success: true,
            message: `Successfully scraped profile for ${alumniName}`
        });

    } catch (error) {
        console.error('Single scrape error:', error);
        return res.status(500).json({ 
            success: false,
            message: error.message || 'Failed to scrape profile'
        });
    }
});

export default router;