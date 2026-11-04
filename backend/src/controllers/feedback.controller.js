import Feedback from '../models/Feedback.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import notify from '../utils/notify.js';
import { sendEmail } from '../utils/email.js';
import { requireFields, assertObjectId } from '../utils/validate.js';

const POPULATE = [
  { path: 'guest', select: 'name email' },
  { path: 'booking', select: 'code checkIn checkOut' },
  { path: 'response.by', select: 'name' },
];

// GET /api/feedback/public  — published reviews for the website
export const getPublicFeedback = async (req, res) => {
  const items = await Feedback.find({ isPublished: true }).populate('guest', 'name city country').sort({ createdAt: -1 }).limit(6);
  const data = items.map((f) => ({
    _id: f._id,
    rating: f.rating,
    title: f.title,
    comment: f.comment,
    createdAt: f.createdAt,
    guestName: f.guest ? f.guest.name.split(' ')[0] : 'Guest',
    guestFrom: f.guest?.city || f.guest?.country || '',
  }));
  res.json({ success: true, data });
};

// POST /api/feedback  { rating, title, comment, bookingId? }
export const createFeedback = async (req, res) => {
  requireFields(req.body, ['rating', 'comment']);
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ApiError(400, 'Rating must be a whole number from 1 to 5.');

  let bookingId;
  if (req.body.bookingId) {
    assertObjectId(req.body.bookingId, 'booking ID');
    const booking = await Booking.findOne({ _id: req.body.bookingId, guest: req.user._id });
    if (!booking) throw new ApiError(404, 'Booking not found.');
    const already = await Feedback.exists({ booking: booking._id });
    if (already) throw new ApiError(409, 'You already left feedback for this stay.');
    bookingId = booking._id;
  }

  const feedback = await Feedback.create({
    guest: req.user._id,
    booking: bookingId,
    rating,
    title: req.body.title,
    comment: req.body.comment,
  });
  await feedback.populate(POPULATE);

  notify({
    roles: ['manager', 'admin'],
    title: `New ${rating}-star feedback`,
    message: feedback.title || feedback.comment.slice(0, 80),
    type: rating <= 2 ? 'alert' : 'info',
    link: '/dashboard/feedback',
  });

  res.status(201).json({ success: true, message: 'Thank you for your feedback.', data: feedback });
};

// GET /api/feedback?rating=
export const getFeedback = async (req, res) => {
  const filter = {};
  if (req.user.role === 'guest') filter.guest = req.user._id;
  if (req.query.rating) filter.rating = Number(req.query.rating);

  const items = await Feedback.find(filter).populate(POPULATE).sort({ createdAt: -1 }).limit(200);
  const avg = items.length ? items.reduce((s, f) => s + f.rating, 0) / items.length : 0;
  res.json({ success: true, data: items, meta: { count: items.length, average: Math.round(avg * 10) / 10 } });
};

// PATCH /api/feedback/:id/respond  { message }
export const respondToFeedback = async (req, res) => {
  requireFields(req.body, ['message']);
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw new ApiError(404, 'Feedback not found.');

  feedback.response = { message: req.body.message, by: req.user._id, at: new Date() };
  await feedback.save();
  await feedback.populate(POPULATE);
  sendEmail('feedbackReply', { to: feedback.guest.email, guest: feedback.guest, message: req.body.message });

  notify({
    users: [feedback.guest._id],
    title: 'The hotel replied to your feedback',
    message: req.body.message.slice(0, 100),
    link: '/dashboard/feedback',
  });

  res.json({ success: true, message: 'Reply sent.', data: feedback });
};

// PATCH /api/feedback/:id/publish  { isPublished }
export const publishFeedback = async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { isPublished: Boolean(req.body.isPublished) },
    { new: true },
  ).populate(POPULATE);
  if (!feedback) throw new ApiError(404, 'Feedback not found.');
  res.json({ success: true, message: feedback.isPublished ? 'Shown on the website.' : 'Hidden from the website.', data: feedback });
};
