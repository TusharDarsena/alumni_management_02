import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import AlumniProfile from '../models/AlumniProfile.js';
import fs from 'fs';
import path from 'path';
import { transformAlumniEntry } from '../utils/alumniTransformer.js';
import { normalizeAlumniEntry } from '../utils/alumniNormalizer.js';

dotenv.config();

const DEFAULT_PASS = process.env.DEFAULT_STUDENT_PASS || 'Welcome@123';

const students = [
  'student1@iiitnr.edu.in',
  'student2@iiitnr.edu.in',
  'student3@iiitnr.edu.in'
];

const admin = {
  email: 'admin@iiitnr.edu.in',
  username:'admin',
  password:DEFAULT_PASS,
  role:'admin',
  isApproved:true,
  isVerified: true,
  phone: '9876543210',
  branch: 'CSE'
};

// Main seeding function that can be called from anywhere
export const seedUsers = async (skipStudentsAndAdmin = false) => {
  console.log('🚀 Starting seeding process...\n');
  try{
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true });
      console.log('✅ MongoDB connected for seeding\n');
    }

    if (!skipStudentsAndAdmin) {
      // Seed students
      for(const email of students){
        const exists = await User.findOne({ email });
        if(!exists){
          await User.create({
            email,
            username: email.split('@')[0],
            password: DEFAULT_PASS,
            role: 'student',
            mustChangePassword:true,
            defaultPassword:true,
            phone: `987654321${students.indexOf(email) + 1}`,
            branch: 'CSE'
          });
          console.log(`Seeded student: ${email}`);
        }
      }

      // Seed admin
      const existsAdmin = await User.findOne({ email: admin.email });
      if(!existsAdmin){
         await User.create(admin);
         console.log(`Seeded admin: ${admin.email}`);
      } else {
     // Update existing admin to ensure isVerified is true
        existsAdmin.isVerified = true;
        await existsAdmin.save();
        console.log(`Updated existing admin: ${admin.email} to verified`);
      }
    }

    // Seed alumni profiles
    const alumniDataDir = path.join(process.cwd(), 'client/data/alumnidata');
    const updatedDataDir = path.join(process.cwd(), 'client/data/updated_data');
    if (!fs.existsSync(updatedDataDir)) {
      fs.mkdirSync(updatedDataDir, { recursive: true });
    }
    
    const files = fs.readdirSync(alumniDataDir).filter(file => file.endsWith('.json'));
    console.log(`📁 Found ${files.length} JSON files in alumnidata\n`);
    
    for (const file of files) {
      const filePath = path.join(alumniDataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      let data;
      try {
        data = JSON.parse(content);
      } catch (e) {
        console.error(`Error parsing JSON file ${file}:`, e);
        continue;
      }
      const entries = Array.isArray(data) ? data : [data];
      for (const entry of entries) {
        const transformedEntry = transformAlumniEntry(entry);
        if (!transformedEntry) {
          console.log(`⚠️  Skipped entry (no URL): ${entry.name || 'Unknown'} from ${file}`);
          continue;
        }
        
        const updatedFileName = `u${entry.id}.json`;
        const updatedFilePath = path.join(updatedDataDir, updatedFileName);
        fs.writeFileSync(updatedFilePath, JSON.stringify(transformedEntry, null, 2));
        console.log(`✅ Created: ${updatedFileName} - ${transformedEntry.name}`);
      }
    }
    
    // Now read from updated_data and seed
    const updatedFiles = fs.readdirSync(updatedDataDir).filter(file => file.endsWith('.json'));
    const linkedinData = updatedFiles.flatMap(file => {
      const filePath = path.join(updatedDataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error(`Error parsing updated JSON file ${file}:`, e);
        return [];
      }
    });
    
    for (const entry of linkedinData) {
      // Normalize the entry before inserting to ensure proper structure
      const normalized = normalizeAlumniEntry(entry);
      
      const filter = normalized.linkedin_id 
        ? { linkedin_id: normalized.linkedin_id }
        : { id: normalized.id };

      await AlumniProfile.updateOne(filter, { $set: normalized }, { upsert: true });
      
      console.log(`✅ ${normalized.name}`);
      console.log(`   Branch: ${normalized.branch || 'null'} | Batch: ${normalized.batch || 'null'}`);
    }

    console.log('Seeding complete');
    return { success: true, count: linkedinData.length };
  } catch(err){
    console.error(err);
    throw err;
  }
};

// When run directly from command line
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

seedUsers().then((result) => {
  console.log('\n========================================');
  console.log('✅ SEEDING COMPLETED SUCCESSFULLY');
  console.log(`Total alumni profiles: ${result.count}`);
  console.log('========================================\n');
  mongoose.disconnect().then(() => process.exit(0));
}).catch(err => {
  console.error('❌ Error during seeding:', err);
  mongoose.disconnect().then(() => process.exit(1));
});