import { Router } from 'express';
import { listUsers, getPermissions, getUser, createUser, updateUser, setUserStatus, sendPasswordReset } from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { FRONT_OFFICE } from '../constants/index.js';

const router = Router();
router.use(protect);

router.get('/permissions', authorize('admin'), getPermissions);
router.route('/').get(authorize(...FRONT_OFFICE), listUsers).post(authorize(...FRONT_OFFICE), createUser);
router.route('/:id').get(authorize(...FRONT_OFFICE), getUser).put(authorize(...FRONT_OFFICE), updateUser);
router.patch('/:id/status', authorize('admin'), setUserStatus);
router.post('/:id/send-reset', authorize('admin'), sendPasswordReset);

export default router;
