import { Router } from 'express';
import { upload, remove } from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.js';
import rateLimiter from '../middleware/rateLimiter.js';

const router = Router();
const uploadLimiter = rateLimiter({ windowMs: 10 * 60 * 1000, max: 60, message: 'Too many uploads. Please wait a few minutes.' });

router.use(protect);
router.post('/', uploadLimiter, upload);
router.delete('/', remove);

export default router;
