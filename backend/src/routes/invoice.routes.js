import { Router } from 'express';
import { getInvoices, getInvoice, addPayment } from '../controllers/invoice.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { FRONT_OFFICE } from '../constants/index.js';

const router = Router();
router.use(protect, authorize(...FRONT_OFFICE, 'guest'));

router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/:id/payments', authorize(...FRONT_OFFICE), addPayment);

export default router;
