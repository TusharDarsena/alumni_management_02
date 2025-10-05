import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import AlumniProfile from '../models/AlumniProfile.js';
import fs from 'fs';
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
  isVerified: true,
  phone: '9876543210',
  branch: 'CSE'
};

// Helper functions for alumni parsing
function isRelevantDegree(degree) {
  if (!degree) return false;
  const deg = degree.toLowerCase();
  return deg.includes("btech") || deg.includes("b.tech") || deg.includes("bachelor of technology") ||
         deg.includes("mtech") || deg.includes("m.tech") || deg.includes("master of technology") ||
         deg.includes("phd") || deg.includes("ph.d") || deg.includes("doctor of philosophy");
}

function extractBatch(education) {
  // Find IIIT-Naya Raipur education with relevant degree
  const iiitEdu = education.find(edu =>
    edu.title && edu.title.toLowerCase().includes("iiit-naya raipur") &&
    isRelevantDegree(edu.degree)
  );
  return iiitEdu ? iiitEdu.start_year : null;
}

function extractBranch(education) {
  // Find IIIT-Naya Raipur education with relevant degree
  const iiitEdu = education.find(edu =>
    edu.title && edu.title.toLowerCase().includes("iiit-naya raipur") &&
    isRelevantDegree(edu.degree)
  );
  if (!iiitEdu) return "CSE"; // Default
  const field = iiitEdu.field;
  if (!field) return "CSE";
  const f = field.toLowerCase();
  // Map to allowed branches from config
  if (f.includes("computer science")) return "CSE";
  if (f.includes("electronics") && f.includes("communication")) return "ECE";
  if (f.includes("data science")) return "DSAI";
  // Add more mappings as needed
  return "CSE"; // Default
}

function extractGraduationYear(education) {
  // Find IIIT-Naya Raipur education with relevant degree
  const iiitEdu = education.find(edu =>
    edu.title && edu.title.toLowerCase().includes("iiit-naya raipur") &&
    isRelevantDegree(edu.degree)
  );
  return iiitEdu ? iiitEdu.end_year : null;
}

function extractCurrentCompany(entry) {
  if (entry.current_company) {
    return {
      name: entry.current_company.name,
      title: entry.current_company.title,
      location: entry.current_company.location
    };
  }
  // Extract from latest experience
  if (entry.experience && entry.experience.length > 0) {
    const latestExp = entry.experience[0]; // Assuming first is latest
    return {
      name: latestExp.company,
      title: latestExp.title,
      location: latestExp.location
    };
  }
  return null;
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
    } else {
     // Update existing admin to ensure isVerified is true
     existsAdmin.isVerified = true;
      await existsAdmin.save();
      console.log(`Updated existing admin: ${admin.email} to verified`);
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
        if (!entry.url) continue;
        const name = entry.name || "Unknown";
        const batch = extractBatch(entry.education);
        const branch = extractBranch(entry.education);
        const graduationYear = extractGraduationYear(entry.education);
        const current_company = extractCurrentCompany(entry);
        const updatedEntry = {
          id: entry.id,
          name,
          avatar: entry.avatar || null,
          position: entry.position || null,
          current_company,
          location: entry.location || null,
          about: entry.about || null,
          education: (entry.education || []).map(edu => ({
            title: edu.title,
            degree: edu.degree,
            field: edu.field,
            start_year: edu.start_year,
            end_year: edu.end_year,
          })),
          experience: (entry.experience || []).map(exp => {
            // Use nested positions if available for more detailed info
            const firstPosition = exp.positions && exp.positions.length > 0 ? exp.positions[0] : null;
            return {
              title: exp.title || (firstPosition ? firstPosition.title : null),
              company: exp.company,
              location: exp.location || (firstPosition ? firstPosition.location : null),
              start_date: exp.start_date || (firstPosition ? firstPosition.start_date : null),
              end_date: exp.end_date || (firstPosition ? firstPosition.end_date : null),
            };
          }),
          batch,
          branch,
          graduationYear,
          url: entry.url,
          linkedin_id: entry.linkedin_id,
        };
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
    process.exit();
  } catch(err){
    console.error(err);
    process.exit(1);
  }
};

seedUsers();
