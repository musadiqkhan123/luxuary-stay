import { Router } from 'express';
import { createRequest, getRequests, updateRequest } from '../controllers/maintenance.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { FRONT_OFFICE } from '../constants/index.js';

const router = Router();
router.use(protect);

router.route('/').get(getRequests).post(createRequest);
router.patch('/:id', authorize(...FRONT_OFFICE), updateRequest);

export default router;
