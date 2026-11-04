import { Router } from 'express';
import { getRooms, checkAvailability, getRoom, createRoom, updateRoom, deleteRoom, updateRoomStatus } from '../controllers/room.controller.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { MANAGEMENT, STAFF_ROLES } from '../constants/index.js';

const router = Router();

router.get('/', optionalAuth, getRooms);
router.get('/availability', checkAvailability);
router.get('/:id', optionalAuth, getRoom);

router.post('/', protect, authorize(...MANAGEMENT), createRoom);
router.put('/:id', protect, authorize(...MANAGEMENT), updateRoom);
router.delete('/:id', protect, authorize(...MANAGEMENT), deleteRoom);
router.patch('/:id/status', protect, authorize(...STAFF_ROLES), updateRoomStatus);

export default router;
