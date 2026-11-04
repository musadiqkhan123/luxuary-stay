import { Router } from 'express';
import {
  createBooking, getBookings, getTodayBoard, getBooking, updateBooking,
  cancelBooking, checkIn, checkOut, getBill,
} from '../controllers/booking.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { FRONT_OFFICE } from '../constants/index.js';

const router = Router();
router.use(protect);

const frontOfficeOrGuest = authorize(...FRONT_OFFICE, 'guest');

router.route('/').get(frontOfficeOrGuest, getBookings).post(frontOfficeOrGuest, createBooking);
router.get('/today', authorize(...FRONT_OFFICE), getTodayBoard);
router.route('/:id').get(frontOfficeOrGuest, getBooking).put(authorize(...FRONT_OFFICE), updateBooking);
router.patch('/:id/cancel', frontOfficeOrGuest, cancelBooking);
router.get('/:id/bill', frontOfficeOrGuest, getBill);
router.post('/:id/check-in', authorize(...FRONT_OFFICE), checkIn);
router.post('/:id/check-out', authorize(...FRONT_OFFICE), checkOut);

export default router;
