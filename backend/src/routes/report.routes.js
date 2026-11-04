import { Router } from 'express';
import { getDashboard, getAnalytics } from '../controllers/report.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { MANAGEMENT } from '../constants/index.js';

const router = Router();
router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/analytics', authorize(...MANAGEMENT), getAnalytics);

export default router;
