import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import AlumniProfile from '../models/AlumniProfile.js';
import { readFile } from 'fs/promises';
import path from 'path';

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
  phone: '9876543210',
  branch: 'CSE'
};

// Helper functions for alumni parsing
function extractBatch(education) {
  const match = education.match(/(\d{4})\s*-\s*(\d{4})/);
  return match ? match[2] : null;
}

function extractBranch(educationStr) {
  if (educationStr.includes("Computer Science")) return "CSE";
  if (educationStr.includes("Electronics")) return "ECE";
  if (educationStr.includes("Data Science")) return "DS";
  return "CSE";
}

function parseEducation(educationStr) {
  if (!educationStr || educationStr === "") return [];
  const parts = educationStr.split(",");
  const institute = parts[0]?.trim() || null;
  const degreeFull = parts[1]?.trim() || "";
  const branch = parts[2]?.trim() || "";
  const years = parts[3]?.trim() || "";
  const yearMatch = years.match(/(\d{4})\s*-\s*(\d{4})/);
  const startYear = yearMatch ? parseInt(yearMatch[1]) : null;
  const endYear = yearMatch ? parseInt(yearMatch[2]) : null;
  const degree = degreeFull.replace("(BTech)", "").trim() + (branch ? ` in ${branch}` : "");
  return [{ degree, institute, startYear, endYear }];
}

function parseExperience(title, company, location, experienceStr) {
  if (!title || !company) return [];
  const role = title;
  const expYears = experienceStr.match(/(\d+\.?\d*)\+?\s*years?/);
  const startYear = expYears ? new Date().getFullYear() - Math.floor(parseFloat(expYears[1])) : null;
  return [{
    role,
    company,
    location: location || null,
    startYear,
    endYear: "Present"
  }];
}

function categorizeSkills(skillsStr) {
  if (!skillsStr || skillsStr === "Not specified" || skillsStr === "(not explicitly listed)") return { technical: [], core: [] };
  const skills = skillsStr.split(",").map(s => s.trim());
  const technical = [];
  const core = [];
  skills.forEach(skill => {
    if (["React", "TypeScript", "Node.js", "Python", "Coding", "Problem-solving"].includes(skill)) {
      technical.push(skill);
    } else {
      core.push(skill);
    }
  });
  return { technical, core };
}

const seedUsers = async () => {
  try{
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true });
    console.log('MongoDB connected for seeding');

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
    }

    // Seed alumni profiles
    const linkedinData = JSON.parse(await readFile(path.join(process.cwd(), 'linkedin_data.json'), 'utf-8'));
    for (const entry of linkedinData) {
      if (!entry["LinkedIn URL"]) continue;
      const name = entry.Title || "Unknown";
      const batch = extractBatch(entry.Education);
      const branch = extractBranch(entry.Education);
      const exists = await AlumniProfile.findOne({ name, batch, branch });
      if (!exists) {
        const profile = {
          name,
          email: null,
          imageUrl: null,
          linkedinUrl: entry["LinkedIn URL"] || null,
          location: entry.Location || null,
          education: parseEducation(entry.Education),
          experience: parseExperience(entry.Title, entry.Company, entry.Location, entry.Experience),
          skills: categorizeSkills(entry.Skills),
          graduationYear: batch ? parseInt(batch) : null,
          batch,
          branch,
        };
        await AlumniProfile.create(profile);
        console.log(`Seeded alumni: ${name}`);
      }
    }

    console.log('Seeding complete');
    process.exit();
  } catch(err){
    console.error(err);
    process.exit(1);
  }
};

seedUsers();
