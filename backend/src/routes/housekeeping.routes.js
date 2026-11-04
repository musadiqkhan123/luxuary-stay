import { Router } from 'express';
import { getTasks, getHousekeepers, createTask, updateTask } from '../controllers/housekeeping.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { FRONT_OFFICE } from '../constants/index.js';

const router = Router();
router.use(protect, authorize('admin', 'manager', 'receptionist', 'housekeeping'));

router.get('/', getTasks);
router.get('/staff', getHousekeepers);
router.post('/', authorize(...FRONT_OFFICE), createTask);
router.patch('/:id', updateTask);

export default router;
