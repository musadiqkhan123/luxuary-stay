import mongoose from 'mongoose';
import { PRIORITIES, MAINTENANCE_STATUSES } from '../constants/index.js';
import imageSchema from './schemas/image.js';

const maintenanceRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    location: { type: String, trim: true, maxlength: 120, default: '' }, // for public areas: "Lobby", "Pool"
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: MAINTENANCE_STATUSES, default: 'open' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionNote: { type: String, trim: true, maxlength: 500, default: '' },
    photos: { type: [imageSchema], default: [] }, // photos of the problem
    roomBlocked: { type: Boolean, default: false },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
