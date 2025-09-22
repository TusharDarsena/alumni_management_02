import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error', err);
    return res.status(401).json({ message: 'Not authenticated' });
  }
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (Array.isArray(role)) {
      if (!role.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    } else {
      if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
