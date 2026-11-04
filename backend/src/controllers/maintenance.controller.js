import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import HousekeepingTask from '../models/HousekeepingTask.js';
import ApiError from '../utils/ApiError.js';
import notify from '../utils/notify.js';
import { PRIORITIES, MAINTENANCE_STATUSES } from '../constants/index.js';
import { requireFields, assertOneOf, pick } from '../utils/validate.js';
import { normalizeImages } from '../utils/images.js';

const POPULATE = [
  { path: 'room', select: 'roomNumber floor status' },
  { path: 'reportedBy', select: 'name role' },
  { path: 'assignedTo', select: 'name' },
];

// POST /api/maintenance  { title, description, priority, roomId?, location?, blockRoom? }
export const createRequest = async (req, res) => {
  requireFields(req.body, ['title']);
  assertOneOf(req.body.priority, PRIORITIES, 'Priority');

  let roomId = req.body.roomId || undefined;
  if (req.user.role === 'guest') {
    const stay = await Booking.findOne({ guest: req.user._id, status: 'checked-in' });
    if (!stay) throw new ApiError(400, 'You can report a problem while you are checked in. Otherwise please contact the front desk.');
    roomId = stay.room;
  }

  let room = null;
  if (roomId) {
    room = await Room.findById(roomId);
    if (!room) throw new ApiError(404, 'Room not found.');
  } else if (!req.body.location) {
    throw new ApiError(400, 'Please choose a room or describe the location.');
  }

  const blockRoom = Boolean(req.body.blockRoom) && req.user.role !== 'guest' && room && room.status !== 'occupied';

  const request = await MaintenanceRequest.create({
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    location: req.body.location,
    room: room?._id,
    reportedBy: req.user._id,
    roomBlocked: blockRoom,
    photos: normalizeImages(req.body.photos, 4) || [],
  });

  if (blockRoom) {
    room.status = 'maintenance';
    await room.save();
  }
  await request.populate(POPULATE);

  notify({
    roles: ['admin', 'manager'],
    title: `Maintenance: ${request.title}`,
    message: `${room ? `Room ${room.roomNumber}` : request.location} · ${request.priority} priority · reported by ${req.user.name}`,
    type: ['high', 'urgent'].includes(request.priority) ? 'alert' : 'warning',
    link: '/dashboard/maintenance',
  });

  res.status(201).json({ success: true, message: 'Issue reported. Our team will look into it.', data: request });
};

// GET /api/maintenance?status=&priority=
export const getRequests = async (req, res) => {
  const filter = {};
  if (req.user.role === 'guest') filter.reportedBy = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;

  const items = await MaintenanceRequest.find(filter).populate(POPULATE).sort({ createdAt: -1 }).limit(300);
  res.json({ success: true, data: items });
};

// PATCH /api/maintenance/:id  { status, priority, assignedTo, resolutionNote }
export const updateRequest = async (req, res) => {
  const request = await MaintenanceRequest.findById(req.params.id).populate('room');
  if (!request) throw new ApiError(404, 'Request not found.');

  const updates = pick(req.body, ['status', 'priority', 'assignedTo', 'resolutionNote']);
  assertOneOf(updates.status, MAINTENANCE_STATUSES, 'Status');
  assertOneOf(updates.priority, PRIORITIES, 'Priority');
  if (updates.assignedTo === '') updates.assignedTo = null;

  const wasResolved = request.status === 'resolved';
  Object.assign(request, updates);

  if (updates.status === 'resolved' && !wasResolved) {
    request.resolvedAt = new Date();
    // Room that was blocked goes to housekeeping for an inspection before it is sold again
    if (request.room && request.room.status === 'maintenance') {
      await Room.findByIdAndUpdate(request.room._id, { status: 'cleaning' });
      await HousekeepingTask.create({
        room: request.room._id,
        type: 'inspection',
        priority: 'medium',
        notes: `Inspect after repair: ${request.title}`,
        createdBy: req.user._id,
      });
    }
    notify({
      users: [request.reportedBy],
      title: 'Issue resolved',
      message: `"${request.title}" has been fixed.`,
      type: 'success',
      link: '/dashboard/maintenance',
    });
  }

  await request.save();
  await request.populate(POPULATE);
  res.json({ success: true, message: 'Maintenance request updated.', data: request });
};
