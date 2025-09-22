import express from 'express';
import { signup, login, verifyUser } from '../controllers/AuthController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/verify', verifyUser);

export default router;
