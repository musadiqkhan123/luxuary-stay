import ServiceRequest from '../models/ServiceRequest.js';
import Booking from '../models/Booking.js';
import Setting from '../models/Setting.js';
import ApiError from '../utils/ApiError.js';
import notify from '../utils/notify.js';
import { SERVICE_TYPES, REQUEST_STATUSES } from '../constants/index.js';
import { requireFields, assertOneOf, assertObjectId } from '../utils/validate.js';

const POPULATE = [
  { path: 'guest', select: 'name phone' },
  { path: 'room', select: 'roomNumber' },
  { path: 'booking', select: 'code' },
  { path: 'handledBy', select: 'name' },
];

const ROLE_FOR_TYPE = {
  laundry: ['housekeeping'],
  housekeeping: ['housekeeping'],
};

// POST /api/services  { type, details, scheduledFor, bookingId? }
export const createRequest = async (req, res) => {
  requireFields(req.body, ['type']);
  assertOneOf(req.body.type, SERVICE_TYPES, 'Service type');

  let booking;
  if (req.user.role === 'guest') {
    booking = await Booking.findOne({ guest: req.user._id, status: 'checked-in' });
    if (!booking) throw new ApiError(400, 'Services can be requested while you are checked in.');
  } else {
    requireFields(req.body, ['bookingId']);
    assertObjectId(req.body.bookingId, 'booking ID');
    booking = await Booking.findOne({ _id: req.body.bookingId, status: 'checked-in' });
    if (!booking) throw new ApiError(400, 'Requests can only be added to a checked-in booking.');
  }

  const settings = await Setting.getSingleton();
  const defaultCharge = settings.servicePrices?.[req.body.type] ?? 0;
  const charge = req.user.role !== 'guest' && req.body.charge !== undefined ? Number(req.body.charge) : defaultCharge;

  const request = await ServiceRequest.create({
    booking: booking._id,
    guest: booking.guest,
    room: booking.room,
    type: req.body.type,
    details: req.body.details,
    scheduledFor: req.body.scheduledFor || undefined,
    charge,
  });
  await request.populate(POPULATE);

  notify({
    roles: ROLE_FOR_TYPE[request.type] || ['receptionist'],
    title: `New ${request.type.replace(/-/g, ' ')} request`,
    message: `Room ${request.room.roomNumber}${request.details ? ` — ${request.details.slice(0, 60)}` : ''}`,
    type: 'alert',
    link: '/dashboard/services',
  });

  res.status(201).json({ success: true, message: 'Request sent.', data: request });
};

// GET /api/services?status=&type=
export const getRequests = async (req, res) => {
  const filter = {};
  if (req.user.role === 'guest') filter.guest = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  const items = await ServiceRequest.find(filter).populate(POPULATE).sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: items });
};

// PATCH /api/services/:id  { status, charge, staffNote }
export const updateRequest = async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found.');
  const { status } = req.body;
  assertOneOf(status, REQUEST_STATUSES, 'Status');

  if (req.user.role === 'guest') {
    if (String(request.guest) !== String(req.user._id)) throw new ApiError(404, 'Request not found.');
    if (status !== 'cancelled' || request.status !== 'pending') {
      throw new ApiError(400, 'You can only cancel requests that are still pending.');
    }
  }
  if (request.billed) throw new ApiError(400, 'This request is already on an invoice and cannot be changed.');

  if (status) request.status = status;
  if (req.user.role !== 'guest') {
    if (req.body.charge !== undefined) {
      if (Number(req.body.charge) < 0) throw new ApiError(400, 'Charge cannot be negative.');
      request.charge = Number(req.body.charge);
    }
    if (req.body.staffNote !== undefined) request.staffNote = req.body.staffNote;
    request.handledBy = req.user._id;
  }
  if (status === 'completed') request.completedAt = new Date();
  await request.save();
  await request.populate(POPULATE);

  if (status && req.user.role !== 'guest' && ['in-progress', 'completed'].includes(status)) {
    notify({
      users: [request.guest._id],
      title: status === 'completed' ? 'Request completed' : 'Request on the way',
      message: `Your ${request.type.replace(/-/g, ' ')} request is ${status.replace('-', ' ')}.`,
      type: status === 'completed' ? 'success' : 'info',
      link: '/dashboard/services',
    });
  }

  res.json({ success: true, message: 'Request updated.', data: request });
};
