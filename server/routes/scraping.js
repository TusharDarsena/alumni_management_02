import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AirtopClient } from '@airtop/sdk'; // <-- CORRECTED: Using the @airtop/sdk package

// Modern way to get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Initialize the Airtop client with your API key from the .env file
const airtopClient = new AirtopClient({ apiKey: process.env.AIRTOP_API_KEY });

// The JSON schema forces the AI to return data in a predictable format.
const jsonSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "url": {
            "type": "string",
            "description": "The final, validated LinkedIn profile URL."
        },
        "error": {
            "type": "string",
            "description": "An error message if a valid profile cannot be found. Must be 'NO_VALID_PROFILE_FOUND'."
        }
    }
};

router.post('/get-linkedin-profile', async (req, res) => {
    const { alumniName } = req.body;
    if (!alumniName) {
        return res.status(400).json({ message: 'Alumni name is required' });
    }

    console.log(`Starting Airtop workflow for: ${alumniName}`);
    let session; // Define session here to ensure it can be closed later

    try {
        // STEP 1: Create a Session
        console.log("Creating Airtop session...");
        session = await airtopClient.sessions.create();
        const sessionId = session.data.id;
        console.log(`Session created: ${sessionId}`);

        // STEP 2: Create a Window & Load URL
        const searchQuery = `site:linkedin.com AND "${alumniName}" AND ("IIIT-Naya Raipur" OR "IIITNR" OR "International Institute of Information Technology Naya Raipur")`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        
        console.log(`Creating window and loading URL...`);
        const window = await airtopClient.windows.create(sessionId, { url: googleUrl });
        const windowId = window.data.windowId;
        console.log(`Window created: ${windowId}`);

        // STEP 3: Query the Page with your AI prompt
        console.log("Querying page with AI prompt...");
        const result = await airtopClient.windows.pageQuery(sessionId, windowId, {
            prompt: `This is Google Search results. The first result should be the LinkedIn page of ${alumniName}.

Extract and return:
1. LinkedIn profile URL (starts with "https://www.linkedin.com/in/")
2. Current company name
3. Job title/professional headline
4. Current location (city, state)
5. Key skills mentioned (if any)
6. Years of experience (if mentioned)
7. Education details (degree, graduation year if visible)

If you cannot find the LinkedIn URL, return empty strings for all fields.

Format the response as:
- URL: [profile url]
- Company: [company name]
- Title: [job title]
- Location: [location]
- Skills: [skills if found]
- Experience: [years if mentioned]
- Education: [education if visible]

            `,
            configuration: {
                outputSchema: jsonSchema,
            },
        });

        const content = JSON.parse(result.data.modelResponse);

        if (content.error || !content.url) {
            console.log('Airtop AI reported an error or could not find a valid profile.');
            return res.status(404).json({ message: 'Airtop: No valid LinkedIn profile found.' });
        }

        const linkedinUrl = content.url;
        console.log(`SUCCESS: Received LinkedIn URL from Airtop: ${linkedinUrl}`);
        
        // FINAL STEP (for now): Save the result
        const testData = { status: "Airtop successful", foundLinkedInUrl: linkedinUrl };
        const fileName = `${alumniName.toLowerCase().replace(/ /g, '_')}.json`;
        const filePath = path.join(__dirname, '../../client/data/alumnidata', fileName);
        fs.writeFileSync(filePath, JSON.stringify(testData, null, 2));

        res.status(200).json({ message: `Airtop workflow successful! Found URL: ${linkedinUrl}` });

    } catch (error) {
        console.error('An error occurred during the Airtop workflow:', error);
        res.status(500).json({ message: 'An error occurred during the Airtop workflow.' });
    } finally {
        // CLEANUP: Terminate the session (as per Quick Start guide)
        if (session) {
            await airtopClient.sessions.terminate(session.data.id);
            console.log("Airtop session terminated.");
        }
    }
});

export default router;