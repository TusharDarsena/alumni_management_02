import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedUsers } from '../scripts/seedUser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const SERP_API_ENDPOINT = 'https://api.brightdata.com/request';
const LINKEDIN_COLLECTOR_ENDPOINT = 'https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_l1viktl72bvl7bjuj0&notify=false&include_errors=true';

const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY;

// --- GLOBAL JOB STATE (In-Memory) ---
// This keeps track of progress even if you refresh the browser
let activeJob = {
    isRunning: false,
    total: 0,
    processed: 0,
    currentName: "",
    logs: [],
    queue: [],
    shouldStop: false
};

// Function to extract first LinkedIn URL from HTML
function findFirstLinkedInUrl(htmlContent) {
    if (!htmlContent || typeof htmlContent !== 'string') {
        return null;
    }
    
    // Multiple regex patterns to find LinkedIn profile URLs
    const patterns = [
        // Pattern 1: href="https://in.linkedin.com/in/..."
        /href=["'](https?:\/\/(?:www\.|in\.)?linkedin\.com\/in\/[^"']+)["']/gi,
        // Pattern 2: Direct URL in text
        /https?:\/\/(?:www\.|in\.)?linkedin\.com\/in\/[\w-]+\/?/gi,
        // Pattern 3: URL encoded format
        /(?:url=|q=)(https?%3A%2F%2F[^&"']+linkedin\.com[^&"']+)/gi
    ];
    
    for (const pattern of patterns) {
        const matches = htmlContent.matchAll(pattern);
        for (const match of matches) {
            let url = match[1] || match[0];
            
            // Decode if URL-encoded
            try {
                url = decodeURIComponent(url);
            } catch (e) {
                // Use original if decode fails
            }
            
            // Clean up the URL (remove query params and fragments)
            if (url.includes('linkedin.com/in/')) {
                // Remove everything after ? or #
                url = url.split('?')[0].split('#')[0].split('&')[0];
                
                // Ensure it's a valid linkedin.com/in/ URL
                if (/linkedin\.com\/in\/[\w-]+\/?$/.test(url)) {
                    console.log('Found LinkedIn URL:', url);
                    return url;
                }
            }
        }
    }
    
    return null;
}

// --- HELPER: The actual scraping logic (Refactored) ---
async function processSingleProfile(alumniName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${alumniName}`);
    console.log('='.repeat(60));

    // === STEP 1: Google Search via Bright Data ===
    console.log('\n[STEP 1] Searching Google for LinkedIn profile...');
    
    const simpleQuery = encodeURIComponent(`${alumniName} and IIIT-Naya Raipur`);
    const googleSearchUrl = `https://www.google.com/search?q=${simpleQuery}&brd_mobile=desktop`;

    const response = await fetch(SERP_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'PostmanRuntime/7.49.0'
        },
        body: JSON.stringify({
            "zone": "serp_api1",
            "url": googleSearchUrl,
            "format": "raw"
        })
    });

    if (!response.ok) {
        throw new Error(`Google Search failed: ${response.status}`);
    }

    const rawHtml = await response.text();
    console.log(`✓ Received HTML (${rawHtml.length} bytes)`);

    // === STEP 2: Extract LinkedIn URL ===
    console.log('\n[STEP 2] Extracting LinkedIn URL from search results...');
    
    const foundUrl = findFirstLinkedInUrl(rawHtml);

    if (!foundUrl) {
        console.log('❌ No LinkedIn URL found');
        
        // Save debug HTML
        const debugHtmlPath = path.join(__dirname, '../../client/data/alumnidata', 
            `${alumniName.toLowerCase().replace(/ /g, '_')}_debug.html`);
        const dirPath = path.join(__dirname, '../../client/data/alumnidata');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(debugHtmlPath, rawHtml);
        console.log(`Debug HTML saved: ${debugHtmlPath}`);
        
        throw new Error('No LinkedIn profile found in search results');
    }

    console.log(`✓ Found LinkedIn URL: ${foundUrl}`);

    // === STEP 3: Save LinkedIn URL ===
    console.log('\n[STEP 3] Saving LinkedIn URL...');
    
    const urlFileName = `${alumniName.toLowerCase().replace(/ /g, '_')}_linkedin_url.txt`;
    const urlDirPath = path.join(__dirname, '../../client/data/alumnidata');
    
    if (!fs.existsSync(urlDirPath)) {
        fs.mkdirSync(urlDirPath, { recursive: true });
    }
    
    const urlFilePath = path.join(urlDirPath, urlFileName);
    fs.writeFileSync(urlFilePath, foundUrl);
    console.log(`✓ Saved URL to: ${urlFileName}`);

    // === STEP 4: Scrape LinkedIn Profile ===
    console.log('\n[STEP 4] Scraping LinkedIn profile data...');

    const linkedinResponse = await fetch(LINKEDIN_COLLECTOR_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "url": foundUrl })
    });

    const rawLinkedinText = await linkedinResponse.text();
    if (!linkedinResponse.ok) {
        throw new Error(`LinkedIn scraping failed: ${linkedinResponse.status}`);
    }
    
    let finalProfileJson;
    try {
        finalProfileJson = JSON.parse(rawLinkedinText);
    } catch(parseError) {
        throw new Error('Invalid LinkedIn API response');
    }

    console.log('✓ Profile data received successfully');

    // === STEP 5: Save Profile JSON ===
    console.log('\n[STEP 5] Saving profile JSON...');
    
    const profileFileName = `${alumniName.toLowerCase().replace(/ /g, '_')}.json`;
    const profileFilePath = path.join(urlDirPath, profileFileName);
    fs.writeFileSync(profileFilePath, JSON.stringify(finalProfileJson, null, 2));
    console.log(`✓ Saved profile to: ${profileFileName}`);
    
    // === STEP 6: Run seedUser.js to populate database ===
    console.log('\n[STEP 6] Running seedUser.js to populate database...');
    
    const seedResult = await seedUsers(true);
    console.log('✓ Database seeded successfully!');
    console.log(`  - Processed ${seedResult.count} alumni profiles`);
    console.log('='.repeat(60));
    
    return "Success";
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

    // Start Background Loop (Do not await this!)
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
        activeJob.processed = i; // Update before starting
        
        try {
            // Call the scraping logic
            await processSingleProfile(name);
            activeJob.logs.unshift(`✅ Success: ${name}`);
        } catch (error) {
            console.error(`Error scraping ${name}:`, error.message);
            activeJob.logs.unshift(`❌ Failed: ${name} - ${error.message}`);
        }
    }

    activeJob.processed = activeJob.total; // Ensure 100% at end
    activeJob.isRunning = false;
    activeJob.currentName = "Completed";
    activeJob.logs.unshift("🎉 Batch Scraping Finished!");
}

// --- LEGACY ENDPOINT (Keep for backwards compatibility) ---
// This endpoint is kept for any old code that might still use it
router.post('/get-linkedin-profile', async (req, res) => {
    const { alumniName } = req.body;
    if (!alumniName) {
        return res.status(400).json({ message: 'Alumni name is required' });
    }

    try {
        // Use the refactored function
        await processSingleProfile(alumniName);
        
        return res.status(200).json({ 
            success: true,
            message: 'Profile scraped and database updated successfully!',
            data: { alumniName }
        });
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        
        return res.status(500).json({ 
            success: false,
            message: 'Failed to scrape LinkedIn profile',
            error: error.message,
            alumniName
        });
    }
});

export default router;