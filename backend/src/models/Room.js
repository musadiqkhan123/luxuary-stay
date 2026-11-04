import mongoose from 'mongoose';
import { ROOM_TYPES, ROOM_STATUSES } from '../constants/index.js';
import imageSchema from './schemas/image.js';

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: [true, 'Room number is required'], unique: true, trim: true },
    type: { type: String, enum: ROOM_TYPES, required: [true, 'Room type is required'] },
    floor: { type: Number, required: [true, 'Floor is required'], min: 0 },
    pricePerNight: { type: Number, required: [true, 'Price per night is required'], min: 0 },
    maxGuests: { type: Number, default: 2, min: 1, max: 10 },
    bedType: { type: String, enum: ['king', 'queen', 'twin'], default: 'king' },
    size: { type: Number, default: 30, min: 0 }, // square metres
    view: { type: String, trim: true, default: 'City' },
    status: { type: String, enum: ROOM_STATUSES, default: 'available' },
    amenities: { type: [String], default: [] },
    images: { type: [imageSchema], default: [] }, // Cloudinary images
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

roomSchema.index({ type: 1, status: 1 });

export default mongoose.model('Room', roomSchema);
