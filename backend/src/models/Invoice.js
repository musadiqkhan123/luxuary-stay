import mongoose from 'mongoose';
import { PAYMENT_METHODS } from '../constants/index.js';

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    category: { type: String, enum: ['room', 'service', 'other'], default: 'other' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    paidAt: { type: Date, default: Date.now },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    payments: { type: [paymentSchema], default: [] },
    status: { type: String, enum: ['unpaid', 'partially-paid', 'paid'], default: 'unpaid' },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

invoiceSchema.virtual('balance').get(function balance() {
  return Math.max(0, Math.round((this.total - this.amountPaid) * 100) / 100);
});

invoiceSchema.methods.refreshStatus = function refreshStatus() {
  if (this.amountPaid <= 0) this.status = 'unpaid';
  else if (this.amountPaid + 0.001 < this.total) this.status = 'partially-paid';
  else this.status = 'paid';
};

invoiceSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Invoice', invoiceSchema);
