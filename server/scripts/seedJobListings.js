import { PrismaClient } from "@prisma/client";
import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const JOB_LISTING_TYPES = ["Full Time", "Part Time", "Internship"];
const JOB_LISTING_EXPERIENCE_LEVELS = ["Junior", "Mid-Level", "Senior"];

const ELIGIBLE_BRANCHES = [
  "CSE",
  "DSAI",
  "ECE",
  "CSE (Data Science/AI)",
  "CSE (Information Security)",
  "ECE (VLSI & Embedded Systems)",
  "Mathematics",
  "Management Studies",
  "All Branches",
];

const ELIGIBLE_ROLES = ["Alumni", "B.Tech", "M.Tech", "PhD", "Open for all"];

// Sample job data with variety for comprehensive filter testing
const jobTemplates = [
  // Full Time Jobs - Various experience levels and locations
  {
    title: "Senior Software Engineer",
    companyName: "Google",
    location: "Bangalore",
    salary: 2500000,
    type: "Full Time",
    experienceLevel: "Senior",
    shortDescription: "Lead development of next-generation cloud infrastructure",
    description: "We are looking for a senior software engineer to join our cloud infrastructure team. You will be responsible for designing and implementing scalable solutions.",
    applyUrl: "https://careers.google.com/apply/123",
    eligibleBranches: ["CSE", "DSAI"],
    eligibleRoles: ["Alumni", "M.Tech"],
  },
  {
    title: "Full Stack Developer",
    companyName: "Microsoft",
    location: "Hyderabad",
    salary: 1800000,
    type: "Full Time",
    experienceLevel: "Mid-Level",
    shortDescription: "Build enterprise applications using modern tech stack",
    description: "Join our team to develop cutting-edge enterprise applications. Experience with React, Node.js, and Azure required.",
    applyUrl: "https://careers.microsoft.com/apply/456",
    eligibleBranches: ["CSE", "ECE"],
    eligibleRoles: ["Alumni", "B.Tech"],
  },
  {
    title: "Junior Frontend Developer",
    companyName: "Amazon",
    location: "Mumbai",
    salary: 1200000,
    type: "Full Time",
    experienceLevel: "Junior",
    shortDescription: "Develop user interfaces for e-commerce platform",
    description: "Work on Amazon's e-commerce platform frontend. Fresh graduates with React knowledge are welcome to apply.",
    applyUrl: "https://amazon.jobs/apply/789",
    eligibleBranches: ["CSE", "DSAI", "ECE"],
    eligibleRoles: ["B.Tech", "Open for all"],
  },
  {
    title: "DevOps Engineer",
    companyName: "Flipkart",
    location: "Bangalore",
    salary: 2000000,
    type: "Full Time",
    experienceLevel: "Mid-Level",
    shortDescription: "Manage cloud infrastructure and CI/CD pipelines",
    description: "Looking for DevOps engineers to manage our cloud infrastructure. Experience with Kubernetes, Docker, and AWS required.",
    applyUrl: "https://flipkart.com/careers/apply/001",
    eligibleBranches: ["CSE", "ECE"],
    eligibleRoles: ["Alumni", "M.Tech"],
  },
  {
    title: "Machine Learning Engineer",
    companyName: "NVIDIA",
    location: "Pune",
    salary: 2800000,
    type: "Full Time",
    experienceLevel: "Senior",
    shortDescription: "Develop ML models for autonomous systems",
    description: "Work on cutting-edge machine learning projects for autonomous vehicles. PhD preferred but not required.",
    applyUrl: "https://nvidia.com/careers/apply/ml001",
    eligibleBranches: ["CSE (Data Science/AI)", "DSAI"],
    eligibleRoles: ["Alumni", "PhD", "M.Tech"],
  },
  
  // Part Time Jobs - Various levels
  {
    title: "Part-Time React Developer",
    companyName: "Swiggy",
    location: "Remote",
    salary: 600000,
    type: "Part Time",
    experienceLevel: "Junior",
    shortDescription: "Build features for food delivery app (20 hrs/week)",
    description: "Flexible part-time opportunity to work on our mobile-first web application. Perfect for students or those looking for flexible hours.",
    applyUrl: "https://swiggy.com/careers/pt001",
    eligibleBranches: ["CSE", "DSAI"],
    eligibleRoles: ["B.Tech", "M.Tech", "Open for all"],
  },
  {
    title: "Part-Time UX Designer",
    companyName: "Zomato",
    location: "Delhi",
    salary: 500000,
    type: "Part Time",
    experienceLevel: "Mid-Level",
    shortDescription: "Design user experiences for restaurant discovery",
    description: "Help us redesign our restaurant discovery experience. 15-20 hours per week, flexible schedule.",
    applyUrl: "https://zomato.com/careers/pt002",
    eligibleBranches: ["All Branches"],
    eligibleRoles: ["Alumni", "Open for all"],
  },
  {
    title: "Part-Time Data Analyst",
    companyName: "Paytm",
    location: "Noida",
    salary: 700000,
    type: "Part Time",
    experienceLevel: "Mid-Level",
    shortDescription: "Analyze payment trends and user behavior",
    description: "Work on data analysis projects to understand user behavior and payment patterns. Remote work available.",
    applyUrl: "https://paytm.com/careers/pt003",
    eligibleBranches: ["CSE", "DSAI", "Mathematics"],
    eligibleRoles: ["M.Tech", "Alumni"],
  },
  {
    title: "Part-Time Content Writer",
    companyName: "Medium",
    location: "Remote",
    salary: 400000,
    type: "Part Time",
    experienceLevel: "Junior",
    shortDescription: "Write technical content and tutorials",
    description: "Create technical content for our developer community. Flexible hours, work from anywhere.",
    applyUrl: "https://medium.com/careers/pt004",
    eligibleBranches: ["All Branches"],
    eligibleRoles: ["B.Tech", "Open for all"],
  },
  
  // Internships - Mostly Junior level
  {
    title: "Software Engineering Intern",
    companyName: "Meta",
    location: "Gurgaon",
    salary: 100000,
    type: "Internship",
    experienceLevel: "Junior",
    shortDescription: "3-month summer internship program",
    description: "Join our summer internship program and work on real-world projects. Mentorship provided by senior engineers.",
    applyUrl: "https://metacareers.com/intern/001",
    eligibleBranches: ["CSE", "ECE", "DSAI"],
    eligibleRoles: ["B.Tech"],
  },
  {
    title: "Data Science Intern",
    companyName: "Walmart Labs",
    location: "Bangalore",
    salary: 80000,
    type: "Internship",
    experienceLevel: "Junior",
    shortDescription: "6-month data science internship",
    description: "Work on data science projects related to retail analytics. Great learning opportunity for students.",
    applyUrl: "https://walmart.com/careers/intern/ds001",
    eligibleBranches: ["DSAI", "CSE (Data Science/AI)", "Mathematics"],
    eligibleRoles: ["B.Tech", "M.Tech"],
  },
  {
    title: "Frontend Development Intern",
    companyName: "Shopify",
    location: "Remote",
    salary: 75000,
    type: "Internship",
    experienceLevel: "Junior",
    shortDescription: "Remote internship - build e-commerce features",
    description: "Work remotely on e-commerce platform features. Learn from experienced developers in a supportive environment.",
    applyUrl: "https://shopify.com/careers/intern/fe001",
    eligibleBranches: ["CSE", "ECE"],
    eligibleRoles: ["B.Tech", "Open for all"],
  },
  {
    title: "Backend Engineering Intern",
    companyName: "Stripe",
    location: "Bangalore",
    salary: 120000,
    type: "Internship",
    experienceLevel: "Junior",
    shortDescription: "Build payment infrastructure",
    description: "Learn to build scalable payment systems. Work with cutting-edge technologies and experienced mentors.",
    applyUrl: "https://stripe.com/careers/intern/be001",
    eligibleBranches: ["CSE", "DSAI"],
    eligibleRoles: ["B.Tech", "M.Tech"],
  },
  {
    title: "ML Research Intern",
    companyName: "OpenAI",
    location: "Remote",
    salary: 150000,
    type: "Internship",
    experienceLevel: "Mid-Level",
    shortDescription: "Research internship in AI/ML",
    description: "Contribute to cutting-edge AI research. Strong mathematical background required. Masters/PhD students preferred.",
    applyUrl: "https://openai.com/careers/intern/ml001",
    eligibleBranches: ["CSE (Data Science/AI)", "DSAI", "Mathematics"],
    eligibleRoles: ["M.Tech", "PhD"],
  },
  
  // More Full Time - Different salary ranges and locations
  {
    title: "Cloud Architect",
    companyName: "IBM",
    location: "Chennai",
    salary: 3000000,
    type: "Full Time",
    experienceLevel: "Senior",
    shortDescription: "Design cloud solutions for enterprise clients",
    description: "Lead cloud architecture initiatives for Fortune 500 companies. Deep expertise in AWS/Azure required.",
    applyUrl: "https://ibm.com/careers/arch001",
    eligibleBranches: ["CSE", "ECE"],
    eligibleRoles: ["Alumni"],
  },
  {
    title: "Mobile App Developer",
    companyName: "PhonePe",
    location: "Bangalore",
    salary: 1500000,
    type: "Full Time",
    experienceLevel: "Mid-Level",
    shortDescription: "Develop mobile apps for digital payments",
    description: "Build features for India's leading digital payment app. Experience with React Native or Flutter required.",
    applyUrl: "https://phonepe.com/careers/mobile001",
    eligibleBranches: ["CSE", "DSAI"],
    eligibleRoles: ["Alumni", "B.Tech"],
  },
  {
    title: "Cybersecurity Analyst",
    companyName: "Cisco",
    location: "Bangalore",
    salary: 1900000,
    type: "Full Time",
    experienceLevel: "Mid-Level",
    shortDescription: "Protect enterprise networks from threats",
    description: "Work on network security solutions for global enterprises. Security certifications are a plus.",
    applyUrl: "https://cisco.com/careers/sec001",
    eligibleBranches: ["CSE (Information Security)", "CSE", "ECE"],
    eligibleRoles: ["Alumni", "M.Tech"],
  },
  {
    title: "Blockchain Developer",
    companyName: "Polygon",
    location: "Remote",
    salary: 2200000,
    type: "Full Time",
    experienceLevel: "Mid-Level",
    shortDescription: "Build Web3 applications on Polygon",
    description: "Develop decentralized applications and smart contracts. Knowledge of Solidity and Web3.js required.",
    applyUrl: "https://polygon.technology/careers/bc001",
    eligibleBranches: ["CSE", "DSAI"],
    eligibleRoles: ["Alumni", "Open for all"],
  },
  {
    title: "AI Research Scientist",
    companyName: "DeepMind",
    location: "Remote",
    salary: 3500000,
    type: "Full Time",
    experienceLevel: "Senior",
    shortDescription: "Conduct cutting-edge AI research",
    description: "Join our research team working on AGI. PhD in Computer Science or related field required.",
    applyUrl: "https://deepmind.com/careers/research001",
    eligibleBranches: ["CSE (Data Science/AI)", "DSAI", "Mathematics"],
    eligibleRoles: ["PhD", "Alumni"],
  },
  {
    title: "Product Manager",
    companyName: "Razorpay",
    location: "Bangalore",
    salary: 2500000,
    type: "Full Time",
    experienceLevel: "Senior",
    shortDescription: "Lead product strategy for payment solutions",
    description: "Drive product roadmap for India's leading payment gateway. MBA or technical background with product experience required.",
    applyUrl: "https://razorpay.com/careers/pm001",
    eligibleBranches: ["All Branches"],
    eligibleRoles: ["Alumni"],
  },
  
  // More variety in locations and salaries
  {
    title: "QA Engineer",
    companyName: "Atlassian",
    location: "Pune",
    salary: 1400000,
    type: "Full Time",
    experienceLevel: "Junior",
    shortDescription: "Test and ensure quality of collaboration tools",
    description: "Work on quality assurance for Jira and Confluence. Automation testing experience is a plus.",
    applyUrl: "https://atlassian.com/careers/qa001",
    eligibleBranches: ["CSE", "ECE"],
    eligibleRoles: ["B.Tech", "Alumni"],
  },
  {
    title: "VLSI Design Engineer",
    companyName: "Intel",
    location: "Bangalore",
    salary: 1800000,
    type: "Full Time",
    experienceLevel: "Mid-Level",
    shortDescription: "Design next-generation processors",
    description: "Work on chip design for next-gen Intel processors. Knowledge of Verilog/VHDL required.",
    applyUrl: "https://intel.com/careers/vlsi001",
    eligibleBranches: ["ECE (VLSI & Embedded Systems)", "ECE"],
    eligibleRoles: ["Alumni", "M.Tech"],
  },
  {
    title: "Embedded Systems Engineer",
    companyName: "Tesla",
    location: "Remote",
    salary: 2600000,
    type: "Full Time",
    experienceLevel: "Senior",
    shortDescription: "Develop embedded software for electric vehicles",
    description: "Build embedded systems for Tesla vehicles. Experience with C/C++ and RTOS required.",
    applyUrl: "https://tesla.com/careers/embedded001",
    eligibleBranches: ["ECE (VLSI & Embedded Systems)", "ECE", "CSE"],
    eligibleRoles: ["Alumni", "M.Tech"],
  },
  {
    title: "Data Engineer",
    companyName: "Airbnb",
    location: "Gurgaon",
    salary: 2100000,
    type: "Full Time",
    experienceLevel: "Mid-Level",
    shortDescription: "Build data pipelines at scale",
    description: "Design and maintain data infrastructure. Experience with Spark, Kafka, and Python required.",
    applyUrl: "https://airbnb.com/careers/data001",
    eligibleBranches: ["CSE", "DSAI", "Mathematics"],
    eligibleRoles: ["Alumni", "M.Tech"],
  },
  {
    title: "Backend Developer",
    companyName: "Uber",
    location: "Bangalore",
    salary: 1700000,
    type: "Full Time",
    experienceLevel: "Junior",
    shortDescription: "Build scalable backend services",
    description: "Develop microservices for Uber's platform. Knowledge of Go or Java required.",
    applyUrl: "https://uber.com/careers/backend001",
    eligibleBranches: ["CSE", "ECE", "DSAI"],
    eligibleRoles: ["B.Tech", "Alumni"],
  },
  
  // Additional Internships
  {
    title: "UI/UX Design Intern",
    companyName: "Adobe",
    location: "Noida",
    salary: 90000,
    type: "Internship",
    experienceLevel: "Junior",
    shortDescription: "Design user interfaces for creative tools",
    description: "Internship opportunity to work on Adobe Creative Cloud products. Portfolio required.",
    applyUrl: "https://adobe.com/careers/intern/ux001",
    eligibleBranches: ["All Branches"],
    eligibleRoles: ["B.Tech", "M.Tech"],
  },
  {
    title: "DevOps Intern",
    companyName: "Red Hat",
    location: "Pune",
    salary: 70000,
    type: "Internship",
    experienceLevel: "Junior",
    shortDescription: "Learn cloud infrastructure management",
    description: "6-month internship working with Kubernetes and OpenShift. Linux knowledge required.",
    applyUrl: "https://redhat.com/careers/intern/devops001",
    eligibleBranches: ["CSE", "ECE"],
    eligibleRoles: ["B.Tech"],
  },
  {
    title: "Product Management Intern",
    companyName: "LinkedIn",
    location: "Bangalore",
    salary: 85000,
    type: "Internship",
    experienceLevel: "Junior",
    shortDescription: "Learn product management in professional networking",
    description: "Work alongside product managers on LinkedIn features. MBA students welcome.",
    applyUrl: "https://linkedin.com/careers/intern/pm001",
    eligibleBranches: ["All Branches"],
    eligibleRoles: ["M.Tech", "Open for all"],
  },
  
  // More Full Time variety
  {
    title: "Site Reliability Engineer",
    companyName: "Netflix",
    location: "Mumbai",
    salary: 2800000,
    type: "Full Time",
    experienceLevel: "Senior",
    shortDescription: "Ensure reliability of streaming infrastructure",
    description: "Build and maintain Netflix's global streaming infrastructure. On-call responsibilities included.",
    applyUrl: "https://netflix.com/careers/sre001",
    eligibleBranches: ["CSE", "ECE"],
    eligibleRoles: ["Alumni"],
  },
  {
    title: "Security Engineer",
    companyName: "PayPal",
    location: "Chennai",
    salary: 2000000,
    type: "Full Time",
    experienceLevel: "Mid-Level",
    shortDescription: "Protect payment systems from threats",
    description: "Work on security for global payment platform. Experience with penetration testing preferred.",
    applyUrl: "https://paypal.com/careers/security001",
    eligibleBranches: ["CSE (Information Security)", "CSE"],
    eligibleRoles: ["Alumni", "M.Tech"],
  },
  {
    title: "Game Developer",
    companyName: "Ubisoft",
    location: "Pune",
    salary: 1600000,
    type: "Full Time",
    experienceLevel: "Mid-Level",
    shortDescription: "Develop AAA gaming titles",
    description: "Work on game development using Unreal Engine. Experience with C++ and game physics required.",
    applyUrl: "https://ubisoft.com/careers/game001",
    eligibleBranches: ["CSE", "ECE"],
    eligibleRoles: ["Alumni", "B.Tech"],
  },
  {
    title: "Research Scientist - Physics",
    companyName: "CERN",
    location: "Remote",
    salary: 2200000,
    type: "Full Time",
    experienceLevel: "Senior",
    shortDescription: "Conduct particle physics research",
    description: "Research position in particle physics. PhD in Physics required.",
    applyUrl: "https://cern.ch/careers/research001",
    eligibleBranches: ["Physics", "Mathematics"],
    eligibleRoles: ["PhD"],
  },
  {
    title: "Quantitative Analyst",
    companyName: "Goldman Sachs",
    location: "Bangalore",
    salary: 3200000,
    type: "Full Time",
    experienceLevel: "Senior",
    shortDescription: "Develop trading algorithms and models",
    description: "Build quantitative models for trading strategies. Strong mathematics and programming skills required.",
    applyUrl: "https://goldmansachs.com/careers/quant001",
    eligibleBranches: ["Mathematics", "CSE", "DSAI"],
    eligibleRoles: ["Alumni", "PhD", "M.Tech"],
  },
  {
    title: "Technical Writer",
    companyName: "HashiCorp",
    location: "Remote",
    salary: 1300000,
    type: "Full Time",
    experienceLevel: "Junior",
    shortDescription: "Write documentation for DevOps tools",
    description: "Create technical documentation for infrastructure tools. Technical background required.",
    applyUrl: "https://hashicorp.com/careers/writer001",
    eligibleBranches: ["All Branches"],
    eligibleRoles: ["B.Tech", "Alumni"],
  },
  {
    title: "Business Analyst",
    companyName: "McKinsey",
    location: "Mumbai",
    salary: 2400000,
    type: "Full Time",
    experienceLevel: "Junior",
    shortDescription: "Analyze business problems for consulting projects",
    description: "Work on consulting projects for top companies. MBA or technical background preferred.",
    applyUrl: "https://mckinsey.com/careers/analyst001",
    eligibleBranches: ["Management Studies", "All Branches"],
    eligibleRoles: ["Alumni", "Open for all"],
  },
  {
    title: "Hardware Engineer",
    companyName: "Apple",
    location: "Bangalore",
    salary: 2700000,
    type: "Full Time",
    experienceLevel: "Senior",
    shortDescription: "Design hardware for next-gen devices",
    description: "Work on hardware design for Apple products. Experience with circuit design and prototyping required.",
    applyUrl: "https://apple.com/careers/hardware001",
    eligibleBranches: ["ECE", "ECE (VLSI & Embedded Systems)"],
    eligibleRoles: ["Alumni", "M.Tech"],
  },
];

async function seedJobListings() {
  try {
    console.log("🌱 Starting job listings seeding...");

    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB connected");
    }

    // Find an admin or alumni user to assign as poster
    const adminUser = await User.findOne({ role: "admin" });
    const alumniUsers = await User.find({ role: "alumni" }).limit(5);

    if (!adminUser && alumniUsers.length === 0) {
      console.error("❌ No users found. Please create at least one user first.");
      process.exit(1);
    }

    const posterUsers = alumniUsers.length > 0 ? alumniUsers : [adminUser];
    let posterIndex = 0;

    // Delete existing job listings
    const deletedCount = await prisma.jobListing.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCount.count} existing job listings`);

    const now = new Date();

    // Create jobs with different expiry dates for variety
    const jobsToCreate = jobTemplates.map((template, index) => {
      const expiresAt = new Date(now);
      expiresAt.setDate(now.getDate() + (30 + (index % 60))); // 30-90 days from now

      const postedAt = new Date(now);
      postedAt.setDate(now.getDate() - (index % 15)); // Posted 0-14 days ago

      // Rotate through available users
      const poster = posterUsers[posterIndex];
      posterIndex = (posterIndex + 1) % posterUsers.length;

      return {
        ...template,
        postedAt,
        expiresAt,
        postedBy: poster._id.toString(),
        eligibleBranches: JSON.stringify(template.eligibleBranches),
        eligibleRoles: JSON.stringify(template.eligibleRoles),
      };
    });

    // Bulk create job listings
    let createdCount = 0;
    for (const jobData of jobsToCreate) {
      await prisma.jobListing.create({ data: jobData });
      createdCount++;
    }

    console.log(`✅ Successfully created ${createdCount} job listings`);
    console.log("\n📊 Summary:");
    console.log(`   - Full Time jobs: ${jobsToCreate.filter((j) => j.type === "Full Time").length}`);
    console.log(`   - Part Time jobs: ${jobsToCreate.filter((j) => j.type === "Part Time").length}`);
    console.log(`   - Internships: ${jobsToCreate.filter((j) => j.type === "Internship").length}`);
    console.log(`   - Junior level: ${jobsToCreate.filter((j) => j.experienceLevel === "Junior").length}`);
    console.log(`   - Mid-Level: ${jobsToCreate.filter((j) => j.experienceLevel === "Mid-Level").length}`);
    console.log(`   - Senior level: ${jobsToCreate.filter((j) => j.experienceLevel === "Senior").length}`);
    console.log(`   - Locations: ${new Set(jobsToCreate.map((j) => j.location)).size} unique cities`);
    console.log(`   - Salary range: ₹${Math.min(...jobsToCreate.map((j) => j.salary)).toLocaleString()} - ₹${Math.max(...jobsToCreate.map((j) => j.salary)).toLocaleString()}`);

  } catch (error) {
    console.error("❌ Error seeding job listings:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await mongoose.disconnect();
    console.log("👋 Disconnected from databases");
    process.exit(0);
  }
}

seedJobListings();
