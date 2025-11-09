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
  username: 'admin',
  password: DEFAULT_PASS,
  role: 'admin',
  isApproved: true,
  isVerified: true,
  phone: '9876543210',
  branch: 'CSE'
};

/**
 * Read validated alumni data from Python AI processing
 */
function loadValidatedAlumniData(dataDir) {
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json') && file.startsWith('validated_'));
  const profiles = [];
  const errors = [];
  
  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const profile = JSON.parse(content);
      
      // Basic validation
      if (!profile.name || !profile.linkedin_id) {
        errors.push({ file, error: 'Missing required fields: name or linkedin_id' });
        continue;
      }
      
      profiles.push(profile);
    } catch (e) {
      errors.push({ file, error: e.message });
    }
  }
  
  return { profiles, errors };
}

/**
 * Transform Python/Pydantic format to MongoDB schema
 * Respects your existing field names: batch, branch, graduationYear
 */
function transformToMongoSchema(validatedProfile) {
  return {
    // Identity (from your schema)
    id: validatedProfile.id,
    linkedin_id: validatedProfile.linkedin_id,
    name: validatedProfile.name,
    first_name: validatedProfile.first_name,
    last_name: validatedProfile.last_name,
    
    // IIIT-NR Data (for filtering - exact names from your schema)
    batch: validatedProfile.batch,  // String
    branch: validatedProfile.branch,  // String
    graduationYear: validatedProfile.graduationYear,  // String
    
    // Current Status
    city: validatedProfile.city,
    country_code: validatedProfile.country_code,
    position: validatedProfile.position,
    current_company: validatedProfile.current_company ? {
      name: validatedProfile.current_company.name,
      company_id: validatedProfile.current_company.company_id,
      title: validatedProfile.current_company.title,
      location: validatedProfile.current_company.location
    } : null,
    location: validatedProfile.location,
    
    // Profile
    avatar: validatedProfile.avatar,
    about: validatedProfile.about,
    
    // Professional History
    education: (validatedProfile.education || []).map(edu => ({
      title: edu.title,
      degree: edu.degree,
      field: edu.field,
      url: edu.url,
      start_year: edu.start_year,
      end_year: edu.end_year,
      description: edu.description,
      description_html: edu.description_html,
      institute_logo_url: edu.institute_logo_url
    })),
    
    experience: (validatedProfile.experience || []).map(exp => ({
      title: exp.title,
      company: exp.company,
      company_id: exp.company_id,
      company_logo_url: exp.company_logo_url,  // NEW: Preserved from AI
      location: exp.location,
      start_date: exp.start_date,
      end_date: exp.end_date,
      duration: exp.duration,
      description_html: exp.description_html,
      url: exp.url,
      positions: (exp.positions || []).map(pos => ({
        subtitle: pos.subtitle,
        meta: pos.meta,
        start_date: pos.start_date,
        end_date: pos.end_date,
        title: pos.title,
        description_html: pos.description_html,
        location: pos.location
      }))
    })),
    
    // NEW: Skills (AI-inferred from experience + projects)
    skills: validatedProfile.skills ? {
      technical: validatedProfile.skills.technical || [],
      tools: validatedProfile.skills.tools || []
    } : null,
    
    // LinkedIn Metadata
    url: validatedProfile.url,
    input_url: validatedProfile.input_url,
    followers: validatedProfile.followers,
    connections: validatedProfile.connections,
    current_company_company_id: validatedProfile.current_company_company_id,
    current_company_name: validatedProfile.current_company_name,
    educations_details: validatedProfile.educations_details,
    linkedin_num_id: validatedProfile.linkedin_num_id,
    banner_image: validatedProfile.banner_image,
    honors_and_awards: validatedProfile.honors_and_awards,
    similar_profiles: validatedProfile.similar_profiles || [],
    bio_links: validatedProfile.bio_links || [],
    timestamp: validatedProfile.timestamp ? new Date(validatedProfile.timestamp) : new Date(),
    input: validatedProfile.input,
    default_avatar: validatedProfile.default_avatar,
    memorialized_account: validatedProfile.memorialized_account,
    
    // Data Quality
    data_quality_score: validatedProfile.data_quality_score,
    extraction_confidence: validatedProfile.extraction_confidence
  };
}

/**
 * Generate seeding statistics
 */
function generateSeedingReport(results) {
  const report = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    byBranch: {},
    byBatch: {},
    averageQualityScore: 0,
    withSkills: 0,
    missingCriticalData: {
      batch: 0,
      company: 0,
      experience: 0
    }
  };
  
  let totalQuality = 0;
  
  results.forEach(result => {
    if (!result.success) return;
    
    const profile = result.profile;
    
    // By branch
    if (profile.branch) {
      report.byBranch[profile.branch] = (report.byBranch[profile.branch] || 0) + 1;
    }
    
    // By batch
    if (profile.batch) {
      report.byBatch[profile.batch] = (report.byBatch[profile.batch] || 0) + 1;
    } else {
      report.missingCriticalData.batch++;
    }
    
    // Quality score
    totalQuality += profile.data_quality_score || 0;
    
    // Skills
    if (profile.skills && (profile.skills.technical.length > 0 || profile.skills.tools.length > 0)) {
      report.withSkills++;
    }
    
    // Missing data
    if (!profile.current_company) report.missingCriticalData.company++;
    if (!profile.experience || profile.experience.length === 0) {
      report.missingCriticalData.experience++;
    }
  });
  
  report.averageQualityScore = report.successful > 0 
    ? (totalQuality / report.successful).toFixed(2) 
    : 0;
  
  return report;
}

/**
 * Main seeding function
 */
const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('MongoDB connected for seeding\n');

    // ==========================================
    // STEP 1: Seed Students
    // ==========================================
    console.log('📚 Seeding students...');
    for (const email of students) {
      const exists = await User.findOne({ email });
      if (!exists) {
        await User.create({
          email,
          username: email.split('@')[0],
          password: DEFAULT_PASS,
          role: 'student',
          mustChangePassword: true,
          defaultPassword: true,
          phone: `987654321${students.indexOf(email) + 1}`,
          branch: 'CSE'
        });
        console.log(`  ✓ Created: ${email}`);
      } else {
        console.log(`  ⊘ Exists: ${email}`);
      }
    }

    // ==========================================
    // STEP 2: Seed Admin
    // ==========================================
    console.log('\n🔐 Seeding admin...');
    const existsAdmin = await User.findOne({ email: admin.email });
    if (!existsAdmin) {
      await User.create(admin);
      console.log(`  ✓ Created: ${admin.email}`);
    } else {
      existsAdmin.isVerified = true;
      await existsAdmin.save();
      console.log(`  ✓ Updated: ${admin.email} (verified)`);
    }

    // ==========================================
    // STEP 3: Load Validated Alumni Data
    // ==========================================
    console.log('\n🎓 Loading validated alumni data...');
    const validatedDataDir = path.join(process.cwd(), 'client/data/validated_data');
    
    if (!fs.existsSync(validatedDataDir)) {
      console.error(`❌ Validated data directory not found: ${validatedDataDir}`);
      console.log('💡 Run Python processing first: python scripts/process_alumni.py');
      process.exit(1);
    }

    const { profiles, errors } = loadValidatedAlumniData(validatedDataDir);
    
    console.log(`  Found ${profiles.length} validated profiles`);
    if (errors.length > 0) {
      console.warn(`  ⚠️  ${errors.length} files had errors:`);
      errors.forEach(err => console.warn(`    - ${err.file}: ${err.error}`));
    }

    // ==========================================
    // STEP 4: Seed Alumni Profiles
    // ==========================================
    console.log('\n💼 Seeding alumni profiles...');
    const results = [];
    
    for (const validatedProfile of profiles) {
      try {
        const mongoDoc = transformToMongoSchema(validatedProfile);
        
        // Upsert (update if exists, insert if new)
        await AlumniProfile.updateOne(
          { linkedin_id: mongoDoc.linkedin_id },
          { $set: mongoDoc },
          { upsert: true }
        );
        
        results.push({
          success: true,
          profile: mongoDoc,
          name: mongoDoc.name
        });
        
        // Visual feedback with quality score
        const qualityEmoji = mongoDoc.data_quality_score >= 0.8 ? '🟢' 
                           : mongoDoc.data_quality_score >= 0.5 ? '🟡' 
                           : '🔴';
        
        const skillsCount = mongoDoc.skills 
          ? (mongoDoc.skills.technical.length + mongoDoc.skills.tools.length)
          : 0;
        
        const skillsEmoji = skillsCount > 0 ? '🎯' : '⚪';
        
        console.log(`  ${qualityEmoji} ${skillsEmoji} ${mongoDoc.name} (Batch: ${mongoDoc.batch || 'N/A'}, Skills: ${skillsCount})`);
        
      } catch (error) {
        results.push({
          success: false,
          name: validatedProfile.name,
          error: error.message
        });
        console.error(`  ✗ Failed: ${validatedProfile.name} - ${error.message}`);
      }
    }

    // ==========================================
    // STEP 5: Generate & Display Report
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING REPORT');
    console.log('='.repeat(60));
    
    const report = generateSeedingReport(results);
    
    console.log(`\n📈 Overall Statistics:`);
    console.log(`  Total Profiles:       ${report.total}`);
    console.log(`  ✓ Successfully Seeded: ${report.successful}`);
    console.log(`  ✗ Failed:             ${report.failed}`);
    console.log(`  Average Quality:      ${(report.averageQualityScore * 100).toFixed(0)}%`);
    console.log(`  Profiles with Skills: ${report.withSkills}`);
    
    console.log(`\n🎯 By Branch:`);
    Object.entries(report.byBranch)
      .sort(([, a], [, b]) => b - a)
      .forEach(([branch, count]) => {
        console.log(`  ${branch.padEnd(15)} ${count}`);
      });
    
    console.log(`\n📅 By Batch:`);
    Object.entries(report.byBatch)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([batch, count]) => {
        console.log(`  ${batch.padEnd(15)} ${count}`);
      });
    
    console.log(`\n⚠️  Missing Critical Data:`);
    console.log(`  Batch:       ${report.missingCriticalData.batch}`);
    console.log(`  Company:     ${report.missingCriticalData.company}`);
    console.log(`  Experience:  ${report.missingCriticalData.experience}`);
    
    // Save detailed report
    const reportPath = path.join(validatedDataDir, 'mongodb_seeding_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);
    
    console.log('\n✅ Seeding complete!');
    console.log('='.repeat(60));
    
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Fatal Error:', err);
    process.exit(1);
  }
};

seedUsers();
