import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const alumni = await mongoose.connection.db.collection('alumniprofiles').aggregate([
  { $group: { _id: '$name', count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } },
  { $sort: { count: -1 } }
]).toArray();

console.log('\nDuplicate names found:', alumni.length);
alumni.forEach(a => console.log(`  ${a._id}: ${a.count} times`));

// Check by linkedin_id too
const byId = await mongoose.connection.db.collection('alumniprofiles').aggregate([
  { $group: { _id: '$linkedin_id', names: { $addToSet: '$name' }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } },
  { $sort: { count: -1 } }
]).toArray();

console.log('\nDuplicate linkedin_ids:', byId.length);
byId.forEach(a => console.log(`  ${a._id}: ${a.count} times - ${a.names.join(', ')}`));

process.exit(0);
