import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import AlumniProfile from '../models/AlumniProfile.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const findUser = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const searchName = 'yogesh kumar';
        const regex = new RegExp(searchName, 'i');

        console.log(`Searching for "${searchName}"...`);

        // Search Users
        const users = await User.find({
            $or: [
                { username: regex },
                { email: regex },
                { 'experience.previous.company': regex } // Just in case, but unlikely
            ]
        });

        console.log(`\nFound ${users.length} matching users in User collection:`);
        if (users.length === 0) console.log("NO USERS FOUND");
        users.forEach(u => {
            console.log(`- ID: ${u._id}, Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`);
        });

        // Search AlumniProfiles
        const profiles = await AlumniProfile.find({
            $or: [
                { name: regex },
                { first_name: regex },
                { last_name: regex }
            ]
        });

        console.log(`\nFound ${profiles.length} matching profiles in AlumniProfile collection:`);
        if (profiles.length === 0) console.log("NO PROFILES FOUND");
        profiles.forEach(p => {
            console.log(`- ID: ${p._id}, Name: ${p.name}, Email: ${p.email || 'N/A'}`); // Email might not be in AlumniProfile schema directly as top level?
        });

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

findUser();
