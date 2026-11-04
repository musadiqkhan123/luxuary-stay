import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import roomRoutes from './room.routes.js';
import bookingRoutes from './booking.routes.js';
import invoiceRoutes from './invoice.routes.js';
import serviceRequestRoutes from './serviceRequest.routes.js';
import housekeepingRoutes from './housekeeping.routes.js';
import maintenanceRoutes from './maintenance.routes.js';
import feedbackRoutes from './feedback.routes.js';
import notificationRoutes from './notification.routes.js';
import reportRoutes from './report.routes.js';
import settingRoutes from './setting.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/services', serviceRequestRoutes);
router.use('/housekeeping', housekeepingRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingRoutes);
router.use('/uploads', uploadRoutes);

export default router;
