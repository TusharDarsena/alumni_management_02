import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student','faculty','alumni','admin'], default: 'student' },
  isApproved: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  defaultPassword: { type: Boolean, default: false },
  resetOtpHash: String,
  resetOtpExpiry: Date,
  createdAt: { type: Date, default: Date.now }
});

// Hash password before save
userSchema.pre('save', async function(next){
  if(!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = function(candidate){
  return bcrypt.compare(candidate, this.password);
}

export default mongoose.model('User', userSchema);
