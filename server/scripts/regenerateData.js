/**
 * Regenerate updated_data and import to MongoDB
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AlumniProfile from '../models/AlumniProfile.js';
import fs from 'fs';
import path from 'path';
import { transformAlumniEntry } from '../utils/alumniTransformer.js';
import { normalizeAlumniEntry } from '../utils/alumniNormalizer.js';

dotenv.config();

async function regenerateAndImport() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const alumniDataDir = path.join(process.cwd(), 'client/data/alumnidata');
    const updatedDataDir = path.join(process.cwd(), 'client/data/updated_data');
    
    if (!fs.existsSync(updatedDataDir)) {
      fs.mkdirSync(updatedDataDir, { recursive: true });
    }
    
    const files = fs.readdirSync(alumniDataDir).filter(file => file.endsWith('.json'));
    console.log(`Found ${files.length} files in alumnidata\n`);
    
    let transformedCount = 0;
    let importedCount = 0;

    for (const file of files) {
      const filePath = path.join(alumniDataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      let data;
      
      try {
        data = JSON.parse(content);
      } catch (e) {
        console.error(`❌ Error parsing JSON file ${file}:`, e.message);
        continue;
      }
      
      const entries = Array.isArray(data) ? data : [data];
      
      for (const entry of entries) {
        // Transform the entry
        const transformedEntry = transformAlumniEntry(entry);
        if (!transformedEntry) {
          console.log(`⚠️  Skipped entry (no URL): ${entry.name || 'Unknown'}`);
          continue;
        }
        
        // Save transformed entry to updated_data
        const updatedFileName = `u${entry.id}.json`;
        const updatedFilePath = path.join(updatedDataDir, updatedFileName);
        fs.writeFileSync(updatedFilePath, JSON.stringify(transformedEntry, null, 2));
        transformedCount++;
        
        // Normalize and import to MongoDB
        const normalized = normalizeAlumniEntry(transformedEntry);
        const filter = normalized.linkedin_id 
          ? { linkedin_id: normalized.linkedin_id }
          : { id: normalized.id };

        await AlumniProfile.updateOne(filter, { $set: normalized }, { upsert: true });
        
        console.log(`✅ ${transformedEntry.name}`);
        console.log(`   Branch: ${transformedEntry.branch || 'null'} | Batch: ${transformedEntry.batch || 'null'}`);
        console.log(`   File: ${updatedFileName}\n`);
        
        importedCount++;
      }
    }

    console.log('\n========================================');
    console.log('✅ COMPLETED');
    console.log(`Files transformed: ${transformedCount}`);
    console.log(`Profiles imported to MongoDB: ${importedCount}`);
    console.log('========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

regenerateAndImport();
