import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import Feedback from '../models/Feedback.js';
import ServiceRequest from '../models/ServiceRequest.js';
import HousekeepingTask from '../models/HousekeepingTask.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import { today, addDays, startOfMonth, toDateOnly } from '../utils/dates.js';
import { ROOM_TYPES, ROOM_STATUSES, ACTIVE_BOOKING_STATUSES } from '../constants/index.js';

const pct = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);
const dayKey = (d) => toDateOnly(d).toISOString().slice(0, 10);

// Count how many booked room-nights fall on each date in [from, to)
const nightlyOccupancy = (bookings, from, days) => {
  const series = [];
  for (let i = 0; i < days; i += 1) {
    const night = addDays(from, i);
    const occupied = bookings.filter((b) => b.checkIn <= night && b.checkOut > night).length;
    series.push({ date: dayKey(night), occupied });
  }
  return series;
};

// GET /api/reports/dashboard  — summary cards for the logged-in role
export const getDashboard = async (req, res) => {
  const role = req.user.role;
  const day = today();

  if (role === 'guest') {
    const [current, upcoming, invoices, openRequests] = await Promise.all([
      Booking.findOne({ guest: req.user._id, status: 'checked-in' }).populate('room', 'roomNumber type floor'),
      Booking.find({ guest: req.user._id, status: 'confirmed' }).populate('room', 'roomNumber type').sort({ checkIn: 1 }).limit(3),
      Invoice.find({ guest: req.user._id }),
      ServiceRequest.countDocuments({ guest: req.user._id, status: { $in: ['pending', 'in-progress'] } }),
    ]);
    const stays = await Booking.countDocuments({ guest: req.user._id, status: 'checked-out' });
    return res.json({
      success: true,
      data: {
        current,
        upcoming,
        stays,
        openRequests,
        totalSpent: invoices.reduce((s, i) => s + i.amountPaid, 0),
        balanceDue: invoices.reduce((s, i) => s + Math.max(0, i.total - i.amountPaid), 0),
      },
    });
  }

  if (role === 'housekeeping') {
    const [tasks, cleaning, openIssues, doneToday] = await Promise.all([
      HousekeepingTask.find({ status: { $ne: 'completed' }, $or: [{ assignedTo: req.user._id }, { assignedTo: null }] })
        .populate('room', 'roomNumber floor status')
        .sort({ dueDate: 1 })
        .limit(8),
      Room.countDocuments({ status: 'cleaning', isActive: true }),
      MaintenanceRequest.countDocuments({ status: { $ne: 'resolved' } }),
      HousekeepingTask.countDocuments({ assignedTo: req.user._id, status: 'completed', completedAt: { $gte: day } }),
    ]);
    return res.json({ success: true, data: { tasks, cleaning, openIssues, doneToday } });
  }

  // Admin / manager / receptionist
  const [rooms, arrivals, departures, inHouse, monthInvoices, pendingRequests, openMaintenance, pendingTasks, ratings, recent] =
    await Promise.all([
      Room.find({ isActive: true }).select('status'),
      Booking.countDocuments({ status: 'confirmed', checkIn: { $lte: day } }),
      Booking.countDocuments({ status: 'checked-in', checkOut: { $lte: day } }),
      Booking.countDocuments({ status: 'checked-in' }),
      Invoice.find({ createdAt: { $gte: startOfMonth() } }).select('total amountPaid'),
      ServiceRequest.countDocuments({ status: { $in: ['pending', 'in-progress'] } }),
      MaintenanceRequest.countDocuments({ status: { $ne: 'resolved' } }),
      HousekeepingTask.countDocuments({ status: { $ne: 'completed' } }),
      Feedback.find().select('rating'),
      Booking.find().populate('guest', 'name').populate('room', 'roomNumber').sort({ createdAt: -1 }).limit(6),
    ]);

  const roomStatus = Object.fromEntries(ROOM_STATUSES.map((s) => [s, 0]));
  rooms.forEach((r) => {
    roomStatus[r.status] += 1;
  });

  res.json({
    success: true,
    data: {
      totalRooms: rooms.length,
      roomStatus,
      occupancy: pct(roomStatus.occupied, rooms.length),
      arrivals,
      departures,
      inHouse,
      revenueThisMonth: monthInvoices.reduce((s, i) => s + i.total, 0),
      collectedThisMonth: monthInvoices.reduce((s, i) => s + i.amountPaid, 0),
      pendingRequests,
      openMaintenance,
      pendingTasks,
      averageRating: ratings.length ? Math.round((ratings.reduce((s, f) => s + f.rating, 0) / ratings.length) * 10) / 10 : 0,
      recentBookings: recent,
    },
  });
};

// GET /api/reports/analytics?days=30  — management reports, forecast and pricing suggestions
export const getAnalytics = async (req, res) => {
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));
  const end = today();
  const start = addDays(end, -days);
  const forecastEnd = addDays(end, 30);

  const [rooms, bookings, invoices, feedback] = await Promise.all([
    Room.find({ isActive: true }).select('type pricePerNight'),
    Booking.find({
      status: { $in: [...ACTIVE_BOOKING_STATUSES, 'checked-out'] },
      checkIn: { $lt: forecastEnd },
      checkOut: { $gt: start },
    })
      .populate('room', 'type')
      .select('checkIn checkOut room status source roomTotal createdAt'),
    Invoice.find({ createdAt: { $gte: start } }).populate({ path: 'booking', select: 'room', populate: { path: 'room', select: 'type' } }),
    Feedback.find({ createdAt: { $gte: start } }).select('rating'),
  ]);

  const totalRooms = rooms.length || 1;

  // Past occupancy & revenue
  const pastBookings = bookings.filter((b) => b.checkIn < end);
  const occupancySeries = nightlyOccupancy(pastBookings, start, days).map((d) => ({ ...d, rate: pct(d.occupied, totalRooms) }));
  const roomNightsSold = occupancySeries.reduce((s, d) => s + d.occupied, 0);
  const revenue = invoices.reduce((s, i) => s + i.total, 0);

  const revenueByDay = {};
  invoices.forEach((inv) => {
    const key = dayKey(inv.createdAt);
    revenueByDay[key] = (revenueByDay[key] || 0) + inv.total;
  });
  const revenueSeries = occupancySeries.map((d) => ({ date: d.date, revenue: Math.round(revenueByDay[d.date] || 0) }));

  const revenueByType = Object.fromEntries(ROOM_TYPES.map((t) => [t, 0]));
  invoices.forEach((inv) => {
    const type = inv.booking?.room?.type;
    if (type) revenueByType[type] += inv.total;
  });

  const bySource = { online: 0, 'front-desk': 0 };
  pastBookings.forEach((b) => {
    if (b.createdAt >= start) bySource[b.source] = (bySource[b.source] || 0) + 1;
  });

  // Forecast: rooms already on the books for the next 30 nights
  const futureBookings = bookings.filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status) && b.checkOut > end);
  const forecastSeries = nightlyOccupancy(futureBookings, end, 30).map((d) => ({ ...d, rate: pct(d.occupied, totalRooms) }));

  // Pricing suggestion per room type based on next-30-day demand
  const pricing = ROOM_TYPES.map((type) => {
    const typeRooms = rooms.filter((r) => r.type === type);
    if (!typeRooms.length) return null;
    const typeBookings = futureBookings.filter((b) => b.room?.type === type);
    const nights = nightlyOccupancy(typeBookings, end, 30).reduce((s, d) => s + d.occupied, 0);
    const demand = pct(nights, typeRooms.length * 30);
    const avgRate = Math.round(typeRooms.reduce((s, r) => s + r.pricePerNight, 0) / typeRooms.length);
    let action = 'keep';
    let change = 0;
    if (demand >= 75) { action = 'raise'; change = 10; }
    else if (demand >= 55) { action = 'raise'; change = 5; }
    else if (demand < 25) { action = 'lower'; change = -10; }
    return {
      type,
      rooms: typeRooms.length,
      forecastOccupancy: demand,
      currentRate: avgRate,
      suggestedRate: Math.round((avgRate * (100 + change)) / 100 / 100) * 100,
      action,
      change,
    };
  }).filter(Boolean);

  const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({ star, count: feedback.filter((f) => f.rating === star).length }));

  res.json({
    success: true,
    data: {
      range: { from: dayKey(start), to: dayKey(end), days },
      totals: {
        rooms: rooms.length,
        averageOccupancy: pct(roomNightsSold, totalRooms * days),
        roomNightsSold,
        revenue: Math.round(revenue),
        adr: roomNightsSold ? Math.round(revenue / roomNightsSold) : 0, // average daily rate
        revpar: Math.round(revenue / (totalRooms * days)), // revenue per available room
        averageRating: feedback.length ? Math.round((feedback.reduce((s, f) => s + f.rating, 0) / feedback.length) * 10) / 10 : 0,
        reviews: feedback.length,
      },
      occupancySeries,
      revenueSeries,
      revenueByType,
      bySource,
      forecastSeries,
      forecastAverage: pct(forecastSeries.reduce((s, d) => s + d.occupied, 0), totalRooms * 30),
      pricing,
      ratingDistribution,
    },
  });
};
