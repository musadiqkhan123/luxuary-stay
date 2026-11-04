import mongoose from 'mongoose';
import { SERVICE_TYPES, REQUEST_STATUSES } from '../constants/index.js';

const serviceRequestSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    type: { type: String, enum: SERVICE_TYPES, required: [true, 'Service type is required'] },
    details: { type: String, trim: true, maxlength: 500, default: '' },
    scheduledFor: { type: Date },
    charge: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: REQUEST_STATUSES, default: 'pending' },
    staffNote: { type: String, trim: true, maxlength: 300, default: '' },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    billed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model('ServiceRequest', serviceRequestSchema);
