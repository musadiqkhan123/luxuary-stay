import { Router } from 'express';
import { createRequest, getRequests, updateRequest } from '../controllers/serviceRequest.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { FRONT_OFFICE } from '../constants/index.js';

const router = Router();
router.use(protect);

router.route('/').get(getRequests).post(authorize(...FRONT_OFFICE, 'guest'), createRequest);
router.patch('/:id', updateRequest);

export default router;
