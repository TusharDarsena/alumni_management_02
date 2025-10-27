import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
                // If decode fails, use original
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

    console.log(`Starting Bright Data workflow for: ${alumniName}`);

    try {
        // --- STEP 1: Get Google Search HTML from Bright Data ---
        
        const simpleQuery = encodeURIComponent(`${alumniName} and IIIT-Naya Raipur`);
        const googleSearchUrl = `https://www.google.com/search?q=${simpleQuery}&brd_mobile=desktop`;

        console.log(`Calling Bright Data SERP API with URL: ${googleSearchUrl}`);

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
                "format": "raw" // Getting raw HTML
            })
        });

        console.log(`Response Status Code: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API request failed with status:', response.status);
            console.error('Response body:', errorText);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Get raw HTML response
        const rawHtml = await response.text();
        console.log(`Successfully received HTML response (Length: ${rawHtml.length})`);

        // --- STEP 2: Extract first LinkedIn URL from HTML ---
        
        const foundUrl = findFirstLinkedInUrl(rawHtml);

        if (!foundUrl) {
            console.log('No LinkedIn profile URL found in HTML.');
            
            // Optionally save the HTML for debugging
            const debugHtmlPath = path.join(__dirname, '../../client/data/alumnidata', `${alumniName.toLowerCase().replace(/ /g, '_')}_debug.html`);
            try {
                const dirPath = path.join(__dirname, '../../client/data/alumnidata');
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
                fs.writeFileSync(debugHtmlPath, rawHtml);
                console.log(`Saved debug HTML to: ${debugHtmlPath}`);
            } catch (err) {
                console.error('Error saving debug HTML:', err);
            }
            
            return res.status(404).json({ message: 'No LinkedIn profile URL found in search results.' });
        }

        console.log(`SUCCESS: Found LinkedIn URL: ${foundUrl}`);

        // --- STEP 3: Save the LinkedIn URL to a text file ---
        
        const urlFileName = `${alumniName.toLowerCase().replace(/ /g, '_')}_linkedin_url.txt`;
        const urlDirPath = path.join(__dirname, '../../client/data/alumnidata');
        
        // Ensure directory exists
        if (!fs.existsSync(urlDirPath)) {
            fs.mkdirSync(urlDirPath, { recursive: true });
            console.log(`Created directory: ${urlDirPath}`);
        }
        
        const urlFilePath = path.join(urlDirPath, urlFileName);
        fs.writeFileSync(urlFilePath, foundUrl);
        console.log(`Saved LinkedIn URL to: ${urlFileName}`);

        // --- STEP 4: Scrape the LinkedIn Profile ---
        
        console.log(`Calling Bright Data LinkedIn Collector for: ${foundUrl}`);

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
            console.error('LinkedIn Collector request failed with status:', linkedinResponse.status);
            console.error('Response body:', rawLinkedinText);
            throw new Error(`LinkedIn Collector HTTP error! Status: ${linkedinResponse.status}`);
        }
        
        let finalProfileJson;
        try {
            finalProfileJson = JSON.parse(rawLinkedinText);
        } catch(parseError) {
            console.error('Failed to parse LinkedIn response:', parseError);
            console.error('Raw LinkedIn Response Body was:', rawLinkedinText);
            throw new Error('Failed to parse LinkedIn API response.');
        }

        console.log('SUCCESS: Received full profile data.');

        // --- STEP 5: Save the final profile JSON file ---
        
        const profileFileName = `${alumniName.toLowerCase().replace(/ /g, '_')}.json`;
        const profileFilePath = path.join(urlDirPath, profileFileName);
        fs.writeFileSync(profileFilePath, JSON.stringify(finalProfileJson, null, 2));

        console.log(`Workflow complete. Profile saved: ${profileFileName}`);
        
        // Return success with all relevant data
        res.status(200).json({ 
            message: `Bright Data workflow successful! Files saved.`,
            profileFileName: profileFileName,
            urlFileName: urlFileName,
            linkedinUrl: foundUrl,
            profile: finalProfileJson
        });

    } catch (error) {
        console.error('An error occurred during the Bright Data workflow:', error.message);
        res.status(500).json({ 
            message: 'An error occurred during the Bright Data workflow.',
            error: error.message 
        });
    }
});

export default router;