import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import notify from '../utils/notify.js';
import { ROOM_STATUSES, ROOM_TYPES, STAFF_ROLES, ACTIVE_BOOKING_STATUSES } from '../constants/index.js';
import { requireFields, pick, assertOneOf } from '../utils/validate.js';
import { toDateOnly, today } from '../utils/dates.js';
import { normalizeImages, deleteImages, removedPublicIds } from '../utils/images.js';

const ROOM_FIELDS = ['roomNumber', 'type', 'floor', 'pricePerNight', 'maxGuests', 'bedType', 'size', 'view', 'status', 'amenities', 'images', 'description', 'isActive'];

const isStaff = (user) => user && STAFF_ROLES.includes(user.role);

// Room ids that already have a booking overlapping [checkIn, checkOut)
export const bookedRoomIds = async (checkIn, checkOut, excludeBookingId) => {
  const filter = {
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };
  const bookings = await Booking.find(filter).select('room');
  return bookings.map((b) => String(b.room));
};

export const parseStayDates = (checkInRaw, checkOutRaw) => {
  const checkIn = toDateOnly(checkInRaw);
  const checkOut = toDateOnly(checkOutRaw);
  if (!checkIn || !checkOut) throw new ApiError(400, 'Please provide valid check-in and check-out dates.');
  if (checkOut <= checkIn) throw new ApiError(400, 'Check-out must be after check-in.');
  return { checkIn, checkOut };
};

// GET /api/rooms  (public; staff see every room and status)
export const getRooms = async (req, res) => {
  const { type, status, guests, minPrice, maxPrice } = req.query;
  const filter = {};

  if (!isStaff(req.user)) filter.isActive = true;
  else if (req.query.active === 'true') filter.isActive = true;

  if (type) filter.type = type;
  if (status && isStaff(req.user)) filter.status = status;
  if (guests) filter.maxGuests = { $gte: Number(guests) };
  if (minPrice || maxPrice) {
    filter.pricePerNight = {};
    if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
    if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
  }

  const rooms = await Room.find(filter).sort({ floor: 1, roomNumber: 1 });
  res.json({ success: true, data: rooms });
};

// GET /api/rooms/availability?checkIn=2026-10-20&checkOut=2026-10-22&guests=2&type=deluxe
export const checkAvailability = async (req, res) => {
  const { checkIn, checkOut } = parseStayDates(req.query.checkIn, req.query.checkOut);
  if (checkIn < today()) throw new ApiError(400, 'Check-in date cannot be in the past.');

  const taken = await bookedRoomIds(checkIn, checkOut);
  const filter = { isActive: true, status: { $ne: 'maintenance' }, _id: { $nin: taken } };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.guests) filter.maxGuests = { $gte: Number(req.query.guests) };

  const rooms = await Room.find(filter).sort({ pricePerNight: 1, roomNumber: 1 });
  res.json({ success: true, data: rooms, meta: { checkIn, checkOut, count: rooms.length } });
};

// GET /api/rooms/:id
export const getRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room || (!room.isActive && !isStaff(req.user))) throw new ApiError(404, 'Room not found.');

  // Upcoming booked date ranges (no guest details) so the calendar can grey them out
  const booked = await Booking.find({
    room: room._id,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkOut: { $gte: today() },
  })
    .select('checkIn checkOut -_id')
    .sort({ checkIn: 1 });

  res.json({ success: true, data: { room, booked } });
};

// POST /api/rooms
export const createRoom = async (req, res) => {
  requireFields(req.body, ['roomNumber', 'type', 'floor', 'pricePerNight']);
  assertOneOf(req.body.type, ROOM_TYPES, 'Room type');
  const data = pick(req.body, ROOM_FIELDS);
  data.images = normalizeImages(data.images) || [];
  const room = await Room.create(data);
  res.status(201).json({ success: true, message: `Room ${room.roomNumber} added.`, data: room });
};

// PUT /api/rooms/:id
export const updateRoom = async (req, res) => {
  const updates = pick(req.body, ROOM_FIELDS);
  assertOneOf(updates.type, ROOM_TYPES, 'Room type');
  assertOneOf(updates.status, ROOM_STATUSES, 'Status');

  if (updates.images !== undefined) updates.images = normalizeImages(updates.images);

  const existing = await Room.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Room not found.');
  const removed = updates.images ? removedPublicIds(existing.images, updates.images) : [];

  const room = await Room.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  deleteImages(removed.map((publicId) => ({ publicId }))); // clean up photos taken off the room
  res.json({ success: true, message: `Room ${room.roomNumber} updated.`, data: room });
};

// DELETE /api/rooms/:id  — hard delete if never booked, otherwise retire it
export const deleteRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) throw new ApiError(404, 'Room not found.');

  const active = await Booking.exists({ room: room._id, status: { $in: ACTIVE_BOOKING_STATUSES } });
  if (active) throw new ApiError(400, 'This room has active bookings. Move or cancel them first.');

  const everBooked = await Booking.exists({ room: room._id });
  if (everBooked) {
    room.isActive = false;
    await room.save();
    return res.json({ success: true, message: `Room ${room.roomNumber} retired (kept for booking history).`, data: room });
  }

  await room.deleteOne();
  await deleteImages(room.images);
  res.json({ success: true, message: `Room ${room.roomNumber} deleted.` });
};

// PATCH /api/rooms/:id/status  — real-time status updates from staff
export const updateRoomStatus = async (req, res) => {
  const { status } = req.body;
  assertOneOf(status, ROOM_STATUSES, 'Status');
  if (!status) throw new ApiError(400, 'Please provide a status.');

  if (req.user.role === 'housekeeping' && !['available', 'cleaning', 'maintenance'].includes(status)) {
    throw new ApiError(403, 'Housekeeping can set rooms to available, cleaning or maintenance only.');
  }

  const room = await Room.findById(req.params.id);
  if (!room) throw new ApiError(404, 'Room not found.');

  if (room.status === 'occupied' && status === 'available') {
    const inHouse = await Booking.exists({ room: room._id, status: 'checked-in' });
    if (inHouse) throw new ApiError(400, 'A guest is still checked in to this room. Check them out first.');
  }

  room.status = status;
  await room.save();

  if (status === 'maintenance') {
    notify({
      roles: ['admin', 'manager'],
      title: `Room ${room.roomNumber} out of service`,
      message: `${req.user.name} marked room ${room.roomNumber} as under maintenance.`,
      type: 'warning',
      link: '/dashboard/rooms',
    });
  }

  res.json({ success: true, message: `Room ${room.roomNumber} is now ${status}.`, data: room });
};
