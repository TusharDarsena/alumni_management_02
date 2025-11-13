import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import AlumniProfile from '../models/AlumniProfile.js';
import fs from 'fs';
import path from 'path';
import { transformAlumniEntry } from '../utils/alumniTransformer.js';

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
  try{
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true });
      console.log('MongoDB connected for seeding');
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
        const updatedEntry = transformAlumniEntry(entry);
        if (!updatedEntry) continue;
        
        const updatedFileName = `u${entry.id}.json`;
        const updatedFilePath = path.join(updatedDataDir, updatedFileName);
        fs.writeFileSync(updatedFilePath, JSON.stringify(updatedEntry, null, 2));
        console.log(`Created updated JSON: ${updatedFileName}`);
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
      await AlumniProfile.updateOne({ id: entry.id }, entry, { upsert: true });
      console.log(`Seeded/Updated alumni: ${entry.name} (Batch: ${entry.batch}, Branch: ${entry.branch})`);
    }

    console.log('Seeding complete');
    return { success: true, count: linkedinData.length };
  } catch(err){
    console.error(err);
    throw err;
  }
};

// When run directly from command line
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers().then(() => {
    process.exit();
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}