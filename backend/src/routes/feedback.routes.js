import { Router } from 'express';
import { getPublicFeedback, createFeedback, getFeedback, respondToFeedback, publishFeedback } from '../controllers/feedback.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { FRONT_OFFICE, MANAGEMENT } from '../constants/index.js';

const router = Router();

router.get('/public', getPublicFeedback);

router.use(protect);
router.route('/').get(authorize(...FRONT_OFFICE, 'guest'), getFeedback).post(authorize('guest'), createFeedback);
router.patch('/:id/respond', authorize(...FRONT_OFFICE), respondToFeedback);
router.patch('/:id/publish', authorize(...MANAGEMENT), publishFeedback);

export default router;
