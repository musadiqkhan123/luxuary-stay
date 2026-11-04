import mongoose from 'mongoose';
import { BOOKING_STATUSES } from '../constants/index.js';

const bookingSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    adults: { type: Number, default: 1, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    ratePerNight: { type: Number, required: true, min: 0 },
    roomTotal: { type: Number, required: true, min: 0 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'confirmed' },
    source: { type: String, enum: ['online', 'front-desk'], default: 'online' },
    specialRequests: { type: String, trim: true, maxlength: 500, default: '' },

    keyCard: { type: String, default: '' },
    checkedInAt: { type: Date },
    checkedOutAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, trim: true, default: '' },

    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ guest: 1, status: 1 });

export default mongoose.model('Booking', bookingSchema);
