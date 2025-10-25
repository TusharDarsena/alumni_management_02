import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// This is the modern way to get the current directory path in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post('/get-linkedin-profile', async (req, res) => {
    const { alumniName } = req.body;

    if (!alumniName) {
        return res.status(400).json({ message: 'Alumni name is required' });
    }

    try {
        const fakeProfileData = {
            name: alumniName,
            headline: "Software Engineer at a Great Company",
            location: "San Francisco, CA",
            url: `https://www.linkedin.com/in/${alumniName.toLowerCase().replace(' ', '-')}`
        };

        const fileName = `${alumniName.toLowerCase().replace(/ /g, '_')}.json`;
        const filePath = path.join(__dirname, '../../client/data/alumnidata', fileName);

        fs.writeFileSync(filePath, JSON.stringify(fakeProfileData, null, 2));

        console.log(`Successfully created file: ${fileName}`);
        res.status(200).json({ message: `Profile for ${alumniName} saved successfully!` });

    } catch (error) {
        console.error('Error saving the profile file:', error);
        res.status(500).json({ message: 'An error occurred while saving the file.' });
    }
});

// Use the modern 'export default' syntax
export default router;