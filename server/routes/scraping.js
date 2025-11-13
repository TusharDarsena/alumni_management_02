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

router.post('/get-linkedin-profile', async (req, res) => {
    const { alumniName } = req.body;
    if (!alumniName) {
        return res.status(400).json({ message: 'Alumni name is required' });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Starting LinkedIn profile scraping for: ${alumniName}`);
    console.log('='.repeat(60));

    try {
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
            const errorText = await response.text();
            console.error('❌ Google Search failed:', response.status);
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
            try {
                const dirPath = path.join(__dirname, '../../client/data/alumnidata');
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
                fs.writeFileSync(debugHtmlPath, rawHtml);
                console.log(`Debug HTML saved: ${debugHtmlPath}`);
            } catch (err) {
                console.error('Error saving debug HTML:', err);
            }
            
            return res.status(404).json({ 
                message: 'No LinkedIn profile found in search results.',
                alumniName 
            });
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
            console.error('❌ LinkedIn scraping failed:', linkedinResponse.status);
            throw new Error(`LinkedIn scraping failed: ${linkedinResponse.status}`);
        }
        
        let finalProfileJson;
        try {
            finalProfileJson = JSON.parse(rawLinkedinText);
        } catch(parseError) {
            console.error('❌ Failed to parse LinkedIn response');
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
        
        try {
            // Call seedUsers function with skipStudentsAndAdmin=true
            // This will only process alumni JSON files
            const seedResult = await seedUsers(true);
            
            console.log('✓ Database seeded successfully!');
            console.log(`  - Processed ${seedResult.count} alumni profiles`);
            console.log('='.repeat(60));
            console.log('✓ COMPLETE: Profile scraped and database updated!\n');
            
            // Return success response
            return res.status(200).json({ 
                success: true,
                message: 'Profile scraped and database updated successfully!',
                data: {
                    alumniName,
                    linkedinUrl: foundUrl,
                    profileFileName,
                    urlFileName,
                    processedCount: seedResult.count
                },
                profile: finalProfileJson
            });
            
        } catch (seedError) {
            console.error('❌ Database seeding failed:', seedError.message);
            console.log('='.repeat(60));
            console.log('⚠ PARTIAL SUCCESS: Profile scraped but database update failed\n');
            
            // Return partial success
            return res.status(207).json({ 
                success: false,
                message: 'Profile scraped but database update failed',
                error: seedError.message,
                data: {
                    alumniName,
                    linkedinUrl: foundUrl,
                    profileFileName,
                    urlFileName
                },
                profile: finalProfileJson
            });
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.log('='.repeat(60) + '\n');
        
        return res.status(500).json({ 
            success: false,
            message: 'Failed to scrape LinkedIn profile',
            error: error.message,
            alumniName
        });
    }
});

export default router;