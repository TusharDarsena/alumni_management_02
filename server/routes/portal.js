import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  // accessible to any authenticated user
  res.json({ message: `Welcome to the portal, ${req.user.username}`, role: req.user.role });
});

export default router;
