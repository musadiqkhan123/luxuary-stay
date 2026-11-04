import mongoose from 'mongoose';
import { TASK_TYPES, TASK_STATUSES, PRIORITIES } from '../constants/index.js';

const housekeepingTaskSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: [true, 'Room is required'] },
    type: { type: String, enum: TASK_TYPES, default: 'cleaning' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: TASK_STATUSES, default: 'pending' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    startedAt: { type: Date },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export default mongoose.model('HousekeepingTask', housekeepingTaskSchema);
