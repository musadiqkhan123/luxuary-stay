import { Router } from 'express';
import { register, login, getMe, updateMe, changePassword, exportMyData, deactivateMe, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import rateLimiter from '../middleware/rateLimiter.js';

const router = Router();
const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many login attempts. Please wait 15 minutes.' });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', rateLimiter({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many reset requests. Please wait 15 minutes.' }), forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.delete('/me', protect, deactivateMe);
router.put('/me/password', protect, changePassword);
router.get('/me/export', protect, exportMyData);

export default router;
