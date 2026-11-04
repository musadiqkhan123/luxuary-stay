/**
 * Demo data seeder — run with:  npm run seed
 * WARNING: this clears all LuxuryStay collections and inserts fresh demo data.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import logger from '../utils/logger.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import ServiceRequest from '../models/ServiceRequest.js';
import HousekeepingTask from '../models/HousekeepingTask.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Feedback from '../models/Feedback.js';
import Notification from '../models/Notification.js';
import Setting from '../models/Setting.js';
import { today, addDays, nightsBetween } from '../utils/dates.js';
import { bookingCode, invoiceNumber, keyCardNumber } from '../utils/codes.js';
import { buildBill } from '../utils/billing.js';
import { configureCloudinary } from '../config/cloudinary.js';
import { uploadImage } from '../utils/images.js';

// Password for every seeded account. Set SEED_PASSWORD in .env to choose your own.
const PASSWORD = process.env.SEED_PASSWORD || 'LuxuryStay@2026';

const IMAGES = {
  classic: [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=70',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=70',
  ],
  deluxe: [
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=70',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=70',
  ],
  executive: [
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=70',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=70',
  ],
  presidential: [
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=70',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=70',
  ],
};

const HERO_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=75';

// Copies demo photos into your Cloudinary account (when keys are set) so every image is served from Cloudinary.
// Without keys the original links are stored, and the app still works.
const toCloudinary = async (urls, folder) => {
  if (!configureCloudinary()) return urls.map((url) => ({ url, publicId: '' }));
  return Promise.all(
    urls.map(async (url) => {
      try {
        return await uploadImage(url, folder, 'demo');
      } catch {
        logger.warn(`Could not copy ${url.slice(0, 60)}… to Cloudinary, keeping the original link`);
        return { url, publicId: '' };
      }
    }),
  );
};

const ROOM_SPECS = {
  classic: { price: 18000, maxGuests: 2, bedType: 'queen', size: 28, view: 'City', amenities: ['Wi-Fi', 'Smart TV', 'Rain shower', 'Work desk', 'Tea & coffee'], description: 'A calm, well-planned room with a queen bed, rain shower and a proper desk — ideal for short city stays.' },
  deluxe: { price: 26000, maxGuests: 3, bedType: 'king', size: 36, view: 'Sea', amenities: ['Wi-Fi', 'Smart TV', 'Bathtub', 'Mini bar', 'Sea view', 'Tea & coffee'], description: 'More space, a king bed and a window seat facing the Arabian Sea. Bathtub and mini bar included.' },
  executive: { price: 38000, maxGuests: 3, bedType: 'king', size: 52, view: 'Sea', amenities: ['Wi-Fi', 'Lounge access', 'Separate living area', 'Nespresso machine', 'Bathtub', 'Sea view'], description: 'A suite with a separate living area, executive lounge access and evening refreshments.' },
  presidential: { price: 65000, maxGuests: 4, bedType: 'king', size: 110, view: 'Panoramic', amenities: ['Wi-Fi', 'Private terrace', 'Dining room', 'Butler service', 'Jacuzzi', 'Lounge access'], description: 'Our top-floor suite with a private terrace, dining room for six and a dedicated butler.' },
};

const LAYOUT = [
  { floor: 1, type: 'classic', numbers: ['101', '102', '103', '104', '105', '106'] },
  { floor: 2, type: 'deluxe', numbers: ['201', '202', '203', '204', '205'] },
  { floor: 3, type: 'executive', numbers: ['301', '302', '303', '304'] },
  { floor: 4, type: 'presidential', numbers: ['401', '402'] },
];

const setCreatedAt = (Model, id, date) => Model.collection.updateOne({ _id: id }, { $set: { createdAt: date, updatedAt: date } });

const seed = async () => {
  await connectDB();
  logger.info('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}), Room.deleteMany({}), Booking.deleteMany({}), Invoice.deleteMany({}),
    ServiceRequest.deleteMany({}), HousekeepingTask.deleteMany({}), MaintenanceRequest.deleteMany({}),
    Feedback.deleteMany({}), Notification.deleteMany({}), Setting.deleteMany({}),
  ]);

  logger.info(configureCloudinary() ? 'Uploading demo photos to Cloudinary (takes a few seconds)...' : 'Cloudinary not configured — demo photos use their original links');
  const roomImages = {};
  for (const [type, urls] of Object.entries(IMAGES)) roomImages[type] = await toCloudinary(urls, 'rooms');
  const [heroImage] = await toCloudinary([HERO_IMAGE], 'hotel');

  const settings = await Setting.create({ heroImage });
  const consent = { privacyAccepted: true, acceptedAt: new Date() };

  // ---------- Users ----------
  const staffData = [
    { name: 'Sara Ahmed', email: 'sara.admin.hms@gmail.com', role: 'admin', jobTitle: 'System Administrator', phone: '+92 300 1111111' },
    { name: 'Omar Siddiqui', email: 'omar.manager.hms@gmail.com', role: 'manager', jobTitle: 'General Manager', phone: '+92 300 2222222' },
    { name: 'Hina Raza', email: 'hina.reception.hms@gmail.com', role: 'receptionist', jobTitle: 'Front Desk Agent', phone: '+92 300 3333333' },
    { name: 'Bilal Hussain', email: 'bilal.housekeeping.hms@gmail.com', role: 'housekeeping', jobTitle: 'Room Attendant', phone: '+92 300 4444444' },
    { name: 'Nadia Iqbal', email: 'nadia.housekeeping.hms@gmail.com', role: 'housekeeping', jobTitle: 'Housekeeping Supervisor', phone: '+92 300 5555555' },
  ];
  const guestData = [
    { name: 'Ayesha Khan', email: 'ayesha.guest.hms@gmail.com', phone: '+92 321 1234567', city: 'Lahore', country: 'Pakistan', preferences: { roomType: 'deluxe', bedType: 'king', floor: 'high', dietary: 'No nuts', notes: 'Extra pillows please' } },
    { name: 'Daniel Hughes', email: 'daniel.hughes.hms@gmail.com', phone: '+44 7700 900123', city: 'London', country: 'United Kingdom' },
    { name: 'Fatima Noor', email: 'fatima.noor.hms@gmail.com', phone: '+92 333 7654321', city: 'Islamabad', country: 'Pakistan' },
    { name: 'Ahmed Al Mansoori', email: 'ahmed.mansoori.hms@gmail.com', phone: '+971 50 123 4567', city: 'Dubai', country: 'UAE' },
    { name: 'Zainab Malik', email: 'zainab.malik.hms@gmail.com', phone: '+92 345 1112223', city: 'Karachi', country: 'Pakistan' },
    { name: 'Lucas Martin', email: 'lucas.martin.hms@gmail.com', phone: '+33 6 12 34 56 78', city: 'Paris', country: 'France' },
    { name: 'Usman Tariq', email: 'usman.tariq.hms@gmail.com', phone: '+92 300 9998887', city: 'Multan', country: 'Pakistan' },
    { name: 'Mei Lin', email: 'mei.lin.hms@gmail.com', phone: '+65 8123 4567', city: 'Singapore', country: 'Singapore' },
  ];

  const staff = [];
  for (const s of staffData) staff.push(await User.create({ ...s, password: PASSWORD }));
  const guests = [];
  for (const g of guestData) guests.push(await User.create({ ...g, password: PASSWORD, role: 'guest', consent }));
  const [admin, manager, reception, hk1, hk2] = staff;
  logger.success(`${staff.length} staff and ${guests.length} guests created`);

  // ---------- Rooms ----------
  const rooms = [];
  for (const block of LAYOUT) {
    const spec = ROOM_SPECS[block.type];
    for (const [i, roomNumber] of block.numbers.entries()) {
      rooms.push(await Room.create({
        roomNumber,
        type: block.type,
        floor: block.floor,
        pricePerNight: spec.price,
        maxGuests: spec.maxGuests,
        bedType: block.type === 'classic' && i % 2 ? 'twin' : spec.bedType,
        size: spec.size,
        view: spec.view,
        amenities: spec.amenities,
        images: roomImages[block.type],
        description: spec.description,
      }));
    }
  }
  const room = (n) => rooms.find((r) => r.roomNumber === n);
  logger.success(`${rooms.length} rooms created`);

  // ---------- Bookings ----------
  const t = today();
  const makeBooking = async ({ guest, roomNo, inOffset, nights, status, source = 'online', createdOffset }) => {
    const r = room(roomNo);
    const checkIn = addDays(t, inOffset);
    const checkOut = addDays(checkIn, nights);
    const booking = await Booking.create({
      code: bookingCode(),
      guest: guest._id,
      room: r._id,
      checkIn,
      checkOut,
      nights: nightsBetween(checkIn, checkOut),
      adults: Math.min(2, r.maxGuests),
      ratePerNight: r.pricePerNight,
      roomTotal: nights * r.pricePerNight,
      status,
      source,
      createdBy: source === 'online' ? guest._id : reception._id,
      ...(status === 'checked-in' || status === 'checked-out' ? { checkedInAt: checkIn, keyCard: keyCardNumber(r.roomNumber) } : {}),
      ...(status === 'checked-out' ? { checkedOutAt: checkOut } : {}),
      ...(status === 'cancelled' ? { cancelledAt: addDays(checkIn, -3), cancelReason: 'Change of travel plans' } : {}),
    });
    await setCreatedAt(Booking, booking._id, addDays(checkIn, -(createdOffset ?? 7)));
    return booking;
  };

  // Past stays (checked out) with paid invoices — gives the reports real history
  const past = [
    [guests[1], '201', -29, 3], [guests[2], '102', -27, 2], [guests[3], '401', -25, 4], [guests[4], '301', -22, 2],
    [guests[5], '203', -20, 5], [guests[6], '101', -18, 1], [guests[7], '302', -16, 3], [guests[0], '204', -14, 2],
    [guests[2], '105', -12, 2], [guests[3], '303', -10, 3], [guests[1], '202', -8, 2], [guests[5], '103', -7, 3],
    [guests[6], '402', -6, 2], [guests[4], '205', -5, 2], [guests[7], '106', -4, 2],
  ];
  const pastBookings = [];
  for (const [i, [guest, roomNo, inOffset, nights]] of past.entries()) {
    const b = await makeBooking({ guest, roomNo, inOffset, nights, status: 'checked-out', source: i % 3 ? 'online' : 'front-desk' });
    const r = room(roomNo);
    const bill = buildBill({
      checkIn: b.checkIn, checkOut: b.checkOut, ratePerNight: b.ratePerNight,
      roomLabel: `Room ${r.roomNumber}`,
      services: i % 2 ? [{ type: 'room-service', details: 'Dinner for two', charge: 3200 }] : [],
      taxRate: settings.taxRate,
    });
    const invoice = await Invoice.create({
      number: invoiceNumber(), booking: b._id, guest: guest._id, ...bill,
      amountPaid: bill.total, status: 'paid',
      payments: [{ amount: bill.total, method: ['card', 'cash', 'bank-transfer'][i % 3], paidAt: b.checkOut, receivedBy: reception._id }],
      issuedBy: reception._id,
    });
    await setCreatedAt(Invoice, invoice._id, b.checkOut);
    b.invoice = invoice._id;
    await b.save();
    pastBookings.push(b);
  }

  // In-house guests
  const ayeshaStay = await makeBooking({ guest: guests[0], roomNo: '203', inOffset: -2, nights: 4, status: 'checked-in' });
  await makeBooking({ guest: guests[3], roomNo: '301', inOffset: -1, nights: 3, status: 'checked-in' });
  await makeBooking({ guest: guests[5], roomNo: '102', inOffset: -3, nights: 3, status: 'checked-in', source: 'front-desk' }); // departs today
  await makeBooking({ guest: guests[7], roomNo: '401', inOffset: -1, nights: 5, status: 'checked-in' });
  for (const n of ['203', '301', '102', '401']) await Room.updateOne({ roomNumber: n }, { status: 'occupied' });

  // Arrivals today
  await makeBooking({ guest: guests[1], roomNo: '205', inOffset: 0, nights: 2, status: 'confirmed' });
  await makeBooking({ guest: guests[4], roomNo: '105', inOffset: 0, nights: 1, status: 'confirmed', source: 'front-desk' });

  // Upcoming reservations (feeds the forecast)
  const upcoming = [
    [guests[2], '201', 2, 3], [guests[6], '302', 3, 2], [guests[0], '204', 9, 3], [guests[5], '101', 5, 4],
    [guests[1], '402', 12, 3], [guests[3], '303', 6, 2], [guests[4], '202', 14, 2], [guests[7], '304', 10, 5],
    [guests[2], '103', 18, 2], [guests[6], '302', 21, 3],
    // Busy suites so the pricing advice shows a mix of raise / keep / lower
    [guests[3], '401', 5, 6], [guests[1], '401', 13, 8], [guests[5], '401', 23, 6], [guests[7], '402', 16, 10],
    [guests[4], '301', 3, 7], [guests[0], '301', 12, 10], [guests[6], '303', 9, 8], [guests[2], '303', 20, 8],
    [guests[5], '304', 16, 12], [guests[1], '203', 4, 6], [guests[3], '205', 3, 5], [guests[7], '201', 8, 9],
  ];
  for (const [guest, roomNo, inOffset, nights] of upcoming) {
    await makeBooking({ guest, roomNo, inOffset, nights, status: 'confirmed', createdOffset: 4 });
  }
  await makeBooking({ guest: guests[5], roomNo: '304', inOffset: 4, nights: 2, status: 'cancelled' });
  logger.success('Bookings and invoices created');

  // ---------- Service requests ----------
  await ServiceRequest.create([
    { booking: ayeshaStay._id, guest: guests[0]._id, room: room('203')._id, type: 'room-service', details: 'Club sandwich and fresh lime', charge: 2500, status: 'completed', completedAt: new Date(), handledBy: reception._id },
    { booking: ayeshaStay._id, guest: guests[0]._id, room: room('203')._id, type: 'laundry', details: '2 shirts, 1 dress — same day', charge: 1500, status: 'pending' },
    { booking: ayeshaStay._id, guest: guests[0]._id, room: room('203')._id, type: 'wake-up-call', details: 'Tomorrow 6:30 AM', scheduledFor: addDays(t, 1), charge: 0, status: 'pending' },
  ]);

  // ---------- Housekeeping ----------
  await Room.updateOne({ roomNumber: '104' }, { status: 'cleaning' });
  await Room.updateOne({ roomNumber: '106' }, { status: 'cleaning' });
  await HousekeepingTask.create([
    { room: room('104')._id, type: 'cleaning', priority: 'high', status: 'pending', assignedTo: hk1._id, notes: 'Check-out clean', createdBy: reception._id },
    { room: room('106')._id, type: 'deep-cleaning', priority: 'medium', status: 'in-progress', assignedTo: hk2._id, startedAt: new Date(), notes: 'Monthly deep clean', createdBy: manager._id },
    { room: room('203')._id, type: 'turndown', priority: 'low', status: 'pending', notes: 'Guest prefers extra pillows', createdBy: reception._id },
    { room: room('205')._id, type: 'inspection', priority: 'medium', status: 'pending', assignedTo: hk1._id, notes: 'Arrival today — inspect before 2 PM', createdBy: reception._id },
  ]);

  // ---------- Maintenance ----------
  await Room.updateOne({ roomNumber: '402' }, { status: 'maintenance' });
  await MaintenanceRequest.create([
    { title: 'AC not cooling', description: 'Split AC in the bedroom blows warm air.', room: room('402')._id, priority: 'high', status: 'in-progress', reportedBy: hk1._id, roomBlocked: true },
    { title: 'Lobby light flickering', description: 'Two ceiling lights near the lifts flicker.', location: 'Lobby', priority: 'low', status: 'open', reportedBy: reception._id },
    { title: 'Leaking tap', description: 'Bathroom tap drips constantly.', room: room('203')._id, priority: 'medium', status: 'open', reportedBy: guests[0]._id },
  ]);

  // ---------- Feedback ----------
  const reviews = [
    [guests[1], 5, 'Felt looked after from the first minute', 'Check-in took two minutes and the room was ready early. The sea view at sunrise is worth the trip alone.', true],
    [guests[3], 5, 'Perfect for a family weekend', 'The suite was spotless and the staff remembered our names. Breakfast was excellent.', true],
    [guests[4], 4, 'Great stay, small wait for laundry', 'Lovely room and very friendly front desk. Laundry came back a little late but everything else was perfect.', true],
    [guests[7], 5, 'Business trip made easy', 'Fast Wi-Fi, a proper desk and quiet rooms. Airport transfer was on time both ways.', true],
    [guests[2], 3, 'Good, but the AC was noisy', 'Comfortable bed and clean bathroom, but the AC made noise at night.', false],
  ];
  for (const [i, [guest, rating, title, comment, isPublished]] of reviews.entries()) {
    const f = await Feedback.create({ guest: guest._id, booking: pastBookings[i]?._id, rating, title, comment, isPublished });
    if (i === 2) {
      f.response = { message: 'Thank you Zainab — we have added a second laundry pickup each afternoon.', by: manager._id, at: new Date() };
      await f.save();
    }
  }

  // ---------- Notifications ----------
  await Notification.create([
    { recipient: admin._id, title: 'Welcome to LuxuryStay HMS', message: 'Demo data is loaded. Explore every module from the sidebar.', type: 'success' },
    { recipient: manager._id, title: 'Room 402 out of service', message: 'AC repair in progress.', type: 'warning', link: '/dashboard/maintenance' },
    { recipient: reception._id, title: '2 arrivals today', message: 'Rooms 205 and 105 are expected today.', link: '/dashboard/front-desk' },
    { recipient: hk1._id, title: 'Room 104 needs cleaning', message: 'High-priority check-out clean.', type: 'alert', link: '/dashboard/housekeeping' },
    { recipient: guests[0]._id, title: 'Welcome to room 203', message: 'Request room service or laundry from your dashboard.', type: 'success', link: '/dashboard/services' },
  ]);

  logger.success('Demo data ready!');
  console.log(`\n  Seeded logins (password for all: ${PASSWORD}) — change them after first login`);
  console.table([...staffData, guestData[0]].map((u) => ({ role: u.role || 'guest', email: u.email })));

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(async (error) => {
  logger.error(`Seeding failed: ${error.message}`);
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
