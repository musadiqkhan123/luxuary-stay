import { Router } from 'express';
import { getSettings, updateSettings, applyRoomRates } from '../controllers/setting.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', getSettings);
router.put('/', protect, authorize('admin'), updateSettings);
router.post('/apply-room-rates', protect, authorize('admin'), applyRoomRates);

export default router;
