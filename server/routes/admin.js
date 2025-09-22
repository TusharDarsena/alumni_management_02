import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Example admin-only route
router.get('/stats', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin stats', stats: { users: 123, active: 42 } });
});

export default router;
