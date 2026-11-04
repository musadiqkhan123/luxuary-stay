import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import ServiceRequest from '../models/ServiceRequest.js';
import HousekeepingTask from '../models/HousekeepingTask.js';
import Setting from '../models/Setting.js';
import ApiError from '../utils/ApiError.js';
import notify from '../utils/notify.js';
import { sendEmail } from '../utils/email.js';
import { buildBill } from '../utils/billing.js';
import { bookingCode, invoiceNumber, keyCardNumber } from '../utils/codes.js';
import { today, nightsBetween, addDays } from '../utils/dates.js';
import { requireFields, pick, assertObjectId, assertOneOf } from '../utils/validate.js';
import { bookedRoomIds, parseStayDates } from './room.controller.js';
import { FRONT_OFFICE, PAYMENT_METHODS } from '../constants/index.js';

const POPULATE = [
  { path: 'guest', select: 'name email phone' },
  { path: 'room', select: 'roomNumber type floor pricePerNight status' },
];

const ROOM_LABEL = { classic: 'Classic Room', deluxe: 'Deluxe Room', executive: 'Executive Suite', presidential: 'Presidential Suite' };

const isFrontOffice = (user) => FRONT_OFFICE.includes(user.role);

const loadBooking = async (id, user) => {
  assertObjectId(id, 'booking ID');
  const booking = await Booking.findById(id).populate(POPULATE);
  if (!booking) throw new ApiError(404, 'Booking not found.');
  if (user.role === 'guest' && String(booking.guest._id) !== String(user._id)) {
    throw new ApiError(404, 'Booking not found.');
  }
  return booking;
};

const ensureRoomFree = async (room, checkIn, checkOut, excludeId) => {
  const taken = await bookedRoomIds(checkIn, checkOut, excludeId);
  if (taken.includes(String(room._id))) {
    throw new ApiError(409, `Room ${room.roomNumber} is already booked for those dates. Please choose other dates or another room.`);
  }
};

// Bill for a booking (live during the stay, final at check-out)
const computeBill = async (booking, { discount = 0, checkOutDate } = {}) => {
  const settings = await Setting.getSingleton();
  const services = await ServiceRequest.find({ booking: booking._id, status: 'completed', billed: false });
  const room = booking.room.roomNumber ? booking.room : await Room.findById(booking.room);

  const bill = buildBill({
    checkIn: booking.checkIn,
    checkOut: checkOutDate || booking.checkOut,
    ratePerNight: booking.ratePerNight,
    roomLabel: `${ROOM_LABEL[room.type] || 'Room'} ${room.roomNumber}`,
    services,
    taxRate: settings.taxRate,
    discount,
  });
  return { bill, services, settings };
};

// POST /api/bookings
export const createBooking = async (req, res) => {
  requireFields(req.body, ['roomId', 'checkIn', 'checkOut']);
  const { roomId, adults = 1, children = 0, specialRequests = '' } = req.body;
  assertObjectId(roomId, 'room ID');

  const { checkIn, checkOut } = parseStayDates(req.body.checkIn, req.body.checkOut);
  if (checkIn < today()) throw new ApiError(400, 'Check-in date cannot be in the past.');
  const nights = nightsBetween(checkIn, checkOut);
  if (nights > 60) throw new ApiError(400, 'Bookings are limited to 60 nights.');

  // Guests book for themselves; front office books for a selected guest
  let guestId = req.user._id;
  if (req.user.role !== 'guest') {
    if (!isFrontOffice(req.user)) throw new ApiError(403, 'You do not have permission to create bookings.');
    requireFields(req.body, ['guestId']);
    assertObjectId(req.body.guestId, 'guest ID');
    const guest = await User.findOne({ _id: req.body.guestId, role: 'guest', isActive: true });
    if (!guest) throw new ApiError(404, 'Guest profile not found.');
    guestId = guest._id;
  }

  const room = await Room.findOne({ _id: roomId, isActive: true });
  if (!room) throw new ApiError(404, 'Room not found.');
  if (room.status === 'maintenance') throw new ApiError(400, `Room ${room.roomNumber} is under maintenance.`);
  if (Number(adults) + Number(children) > room.maxGuests) {
    throw new ApiError(400, `Room ${room.roomNumber} fits a maximum of ${room.maxGuests} guests.`);
  }

  await ensureRoomFree(room, checkIn, checkOut);

  const booking = await Booking.create({
    code: bookingCode(),
    guest: guestId,
    room: room._id,
    checkIn,
    checkOut,
    nights,
    adults,
    children,
    ratePerNight: room.pricePerNight,
    roomTotal: nights * room.pricePerNight,
    source: req.user.role === 'guest' ? 'online' : 'front-desk',
    specialRequests,
    createdBy: req.user._id,
  });

  await booking.populate(POPULATE);
  sendEmail('bookingConfirmed', { to: booking.guest.email, booking });

  notify({
    users: [guestId],
    title: 'Booking confirmed',
    message: `Your booking ${booking.code} for room ${room.roomNumber} is confirmed.`,
    type: 'success',
    link: `/dashboard/bookings/${booking._id}`,
  });
  notify({
    roles: ['receptionist', 'manager'],
    title: 'New reservation',
    message: `${booking.code} · Room ${room.roomNumber} · ${nights} night(s)`,
    link: `/dashboard/bookings/${booking._id}`,
  });

  res.status(201).json({ success: true, message: `Booking ${booking.code} confirmed.`, data: booking });
};

// GET /api/bookings?status=&search=&from=&to=&page=
export const getBookings = async (req, res) => {
  const { status, search, from, to, guestId } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};

  if (req.user.role === 'guest') filter.guest = req.user._id;
  else if (guestId) filter.guest = guestId;

  if (status) filter.status = status;
  if (from) filter.checkOut = { $gte: new Date(from) };
  if (to) filter.checkIn = { ...(filter.checkIn || {}), $lte: new Date(to) };
  if (search) {
    const term = String(search).trim();
    const [guests, rooms] = await Promise.all([
      User.find({ role: 'guest', name: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).select('_id'),
      Room.find({ roomNumber: term }).select('_id'),
    ]);
    filter.$or = [
      { code: term.toUpperCase() },
      { guest: { $in: guests.map((g) => g._id) } },
      { room: { $in: rooms.map((r) => r._id) } },
    ];
  }

  const [items, total] = await Promise.all([
    Booking.find(filter).populate(POPULATE).sort({ checkIn: -1 }).skip((page - 1) * limit).limit(limit),
    Booking.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { total, page, pages: Math.ceil(total / limit) || 1, limit } });
};

// GET /api/bookings/today  — front desk board
export const getTodayBoard = async (req, res) => {
  const day = today();
  const [arrivals, departures, inHouse] = await Promise.all([
    Booking.find({ status: 'confirmed', checkIn: { $lte: day } }).populate(POPULATE).sort({ checkIn: 1 }),
    Booking.find({ status: 'checked-in', checkOut: { $lte: day } }).populate(POPULATE).sort({ checkOut: 1 }),
    Booking.find({ status: 'checked-in' }).populate(POPULATE).sort({ checkOut: 1 }),
  ]);
  res.json({ success: true, data: { date: day, arrivals, departures, inHouse } });
};

// GET /api/bookings/:id
export const getBooking = async (req, res) => {
  const booking = await loadBooking(req.params.id, req.user);
  const [services, invoice] = await Promise.all([
    ServiceRequest.find({ booking: booking._id }).sort({ createdAt: -1 }),
    booking.invoice ? Invoice.findById(booking.invoice) : null,
  ]);
  res.json({ success: true, data: { booking, services, invoice } });
};

// PUT /api/bookings/:id  — front office changes dates / room / guests
export const updateBooking = async (req, res) => {
  const booking = await loadBooking(req.params.id, req.user);
  const updates = pick(req.body, ['roomId', 'checkIn', 'checkOut', 'adults', 'children', 'specialRequests']);

  const changingStay = updates.roomId || updates.checkIn || updates.checkOut;
  if (changingStay && booking.status !== 'confirmed') {
    throw new ApiError(400, 'Dates and room can only be changed before check-in.');
  }
  if (['checked-out', 'cancelled', 'no-show'].includes(booking.status)) {
    throw new ApiError(400, 'This booking is closed and cannot be edited.');
  }

  if (changingStay) {
    const { checkIn, checkOut } = parseStayDates(updates.checkIn || booking.checkIn, updates.checkOut || booking.checkOut);
    if (checkIn < today()) throw new ApiError(400, 'Check-in date cannot be in the past.');

    const room = updates.roomId ? await Room.findOne({ _id: updates.roomId, isActive: true }) : await Room.findById(booking.room._id);
    if (!room) throw new ApiError(404, 'Room not found.');
    await ensureRoomFree(room, checkIn, checkOut, booking._id);

    const roomChanged = String(room._id) !== String(booking.room._id);
    booking.room = room._id;
    booking.checkIn = checkIn;
    booking.checkOut = checkOut;
    booking.nights = nightsBetween(checkIn, checkOut);
    if (roomChanged) booking.ratePerNight = room.pricePerNight;
    booking.roomTotal = booking.nights * booking.ratePerNight;
  }

  if (updates.adults !== undefined) booking.adults = updates.adults;
  if (updates.children !== undefined) booking.children = updates.children;
  if (updates.specialRequests !== undefined) booking.specialRequests = updates.specialRequests;

  await booking.save();
  await booking.populate(POPULATE);
  res.json({ success: true, message: 'Booking updated.', data: booking });
};

// PATCH /api/bookings/:id/cancel
export const cancelBooking = async (req, res) => {
  const booking = await loadBooking(req.params.id, req.user);
  if (booking.status !== 'confirmed') throw new ApiError(400, 'Only confirmed bookings that have not checked in can be cancelled.');

  if (req.user.role === 'guest' && booking.checkIn <= today()) {
    throw new ApiError(400, 'Same-day bookings can only be cancelled by the front desk. Please call the hotel.');
  }

  booking.status = req.body.noShow && isFrontOffice(req.user) ? 'no-show' : 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelReason = String(req.body.reason || '').slice(0, 200);
  await booking.save();
  sendEmail('bookingCancelled', { to: booking.guest.email, booking });

  notify({
    users: [booking.guest._id],
    title: 'Booking cancelled',
    message: `Booking ${booking.code} has been cancelled.`,
    type: 'warning',
    link: `/dashboard/bookings/${booking._id}`,
  });
  if (req.user.role === 'guest') {
    notify({ roles: ['receptionist'], title: 'Guest cancelled a booking', message: `${booking.code} · Room ${booking.room.roomNumber}` });
  }

  res.json({ success: true, message: `Booking ${booking.code} cancelled.`, data: booking });
};

// POST /api/bookings/:id/check-in
export const checkIn = async (req, res) => {
  const booking = await loadBooking(req.params.id, req.user);
  if (booking.status !== 'confirmed') throw new ApiError(400, `Cannot check in a booking that is ${booking.status}.`);
  if (booking.checkIn > today()) throw new ApiError(400, 'Check-in is only possible on or after the arrival date.');
  if (booking.checkOut <= today()) throw new ApiError(400, 'This stay has already ended. Mark it as a no-show or change the dates.');

  const room = await Room.findById(booking.room._id);
  if (['occupied', 'maintenance'].includes(room.status)) {
    throw new ApiError(400, `Room ${room.roomNumber} is ${room.status}. Assign a different room before check-in.`);
  }
  if (room.status === 'cleaning' && !req.body.force) {
    throw new ApiError(400, `Room ${room.roomNumber} is still being cleaned. Wait for housekeeping or assign another room.`);
  }

  booking.status = 'checked-in';
  booking.checkedInAt = new Date();
  booking.keyCard = keyCardNumber(room.roomNumber);
  await booking.save();

  room.status = 'occupied';
  await room.save();
  sendEmail('checkedIn', { to: booking.guest.email, booking });

  notify({
    users: [booking.guest._id],
    title: `Welcome to room ${room.roomNumber}`,
    message: 'You are checked in. Request room service, laundry or transport from your dashboard.',
    type: 'success',
    link: '/dashboard/services',
  });

  await booking.populate(POPULATE);
  res.json({ success: true, message: `${booking.guest.name} checked in to room ${room.roomNumber}. Key card ${booking.keyCard} issued.`, data: booking });
};

// GET /api/bookings/:id/bill  — live bill preview
export const getBill = async (req, res) => {
  const booking = await loadBooking(req.params.id, req.user);
  if (booking.invoice) {
    const invoice = await Invoice.findById(booking.invoice);
    return res.json({ success: true, data: { final: true, invoice } });
  }
  const { bill, settings } = await computeBill(booking);
  res.json({ success: true, data: { final: false, bill, currency: settings.currency } });
};

// POST /api/bookings/:id/check-out  { discount, payment: { amount, method }, earlyDeparture }
export const checkOut = async (req, res) => {
  const booking = await loadBooking(req.params.id, req.user);
  if (booking.status !== 'checked-in') throw new ApiError(400, 'Only checked-in guests can be checked out.');

  // Early departure → charge nights actually stayed (minimum 1)
  const day = today();
  const checkOutDate = day < booking.checkOut ? (day > booking.checkIn ? day : addDays(booking.checkIn, 1)) : booking.checkOut;

  const discount = Number(req.body.discount) || 0;
  const { bill, services } = await computeBill(booking, { discount, checkOutDate });

  const invoice = new Invoice({
    number: invoiceNumber(),
    booking: booking._id,
    guest: booking.guest._id,
    items: bill.items,
    subtotal: bill.subtotal,
    discount: bill.discount,
    taxRate: bill.taxRate,
    tax: bill.tax,
    total: bill.total,
    issuedBy: req.user._id,
    notes: String(req.body.notes || ''),
  });

  const payment = req.body.payment;
  if (payment && Number(payment.amount) > 0) {
    assertOneOf(payment.method, PAYMENT_METHODS, 'Payment method');
    const amount = Math.min(Number(payment.amount), bill.total);
    invoice.payments.push({ amount, method: payment.method, receivedBy: req.user._id });
    invoice.amountPaid = amount;
  }
  invoice.refreshStatus();
  await invoice.save();

  await ServiceRequest.updateMany({ _id: { $in: services.map((s) => s._id) } }, { billed: true });
  // Any open requests are no longer needed once the guest leaves
  await ServiceRequest.updateMany({ booking: booking._id, status: { $in: ['pending', 'in-progress'] } }, { status: 'cancelled' });

  booking.status = 'checked-out';
  booking.checkedOutAt = new Date();
  booking.invoice = invoice._id;
  if (checkOutDate < booking.checkOut) {
    booking.checkOut = checkOutDate;
    booking.nights = bill.nights;
    booking.roomTotal = bill.nights * booking.ratePerNight;
  }
  await booking.save();

  await Room.findByIdAndUpdate(booking.room._id, { status: 'cleaning' });
  await HousekeepingTask.create({
    room: booking.room._id,
    type: 'cleaning',
    priority: 'high',
    notes: `Check-out clean after ${booking.code}`,
    createdBy: req.user._id,
  });

  notify({
    roles: ['housekeeping'],
    title: `Room ${booking.room.roomNumber} needs cleaning`,
    message: 'Guest checked out. High-priority clean added to the task list.',
    type: 'alert',
    link: '/dashboard/housekeeping',
  });
  sendEmail('invoice', { to: booking.guest.email, invoice, booking });
  notify({
    users: [booking.guest._id],
    title: 'Thank you for staying with us',
    message: `Invoice ${invoice.number} is ready. We would love your feedback.`,
    type: 'success',
    link: `/dashboard/invoices/${invoice._id}`,
  });

  res.json({
    success: true,
    message: `Checked out. Invoice ${invoice.number} created.`,
    data: { booking, invoice },
  });
};
