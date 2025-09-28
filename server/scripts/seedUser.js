import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

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

    console.log('Seeding complete');
    process.exit();
  } catch(err){
    console.error(err);
    process.exit(1);
  }
};

seedUsers();
