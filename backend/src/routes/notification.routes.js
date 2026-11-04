import { Router } from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

export default router;
