import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import Feedback from '../models/Feedback.js';
import ServiceRequest from '../models/ServiceRequest.js';
import ApiError from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';
import { requireFields, pick, isEmail, isStrongPassword } from '../utils/validate.js';
import { normalizeImage, deleteImage } from '../utils/images.js';
import { sendEmail, appUrl } from '../utils/email.js';

const RESET_MINUTES = 30;

const PROFILE_FIELDS = ['name', 'phone', 'address', 'city', 'country', 'preferences'];

const authResponse = (res, status, user) =>
  res.status(status).json({ success: true, data: { token: signToken(user), user } });

// POST /api/auth/register  — public guest sign-up
export const register = async (req, res) => {
  const { name, email, password, phone, privacyAccepted, marketing } = req.body;
  requireFields(req.body, ['name', 'email', 'password']);

  if (!isEmail(email)) throw new ApiError(400, 'Please enter a valid email address.');
  if (!isStrongPassword(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters and include a letter and a number.');
  }
  if (!privacyAccepted) throw new ApiError(400, 'Please accept the privacy policy to create an account.');

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw new ApiError(409, 'An account with this email already exists.');

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: 'guest',
    consent: { privacyAccepted: true, acceptedAt: new Date(), marketing: Boolean(marketing) },
  });

  sendEmail('welcome', { to: user.email, user });
  authResponse(res, 201, user);
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;
  requireFields(req.body, ['email', 'password']);

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(String(password)))) {
    throw new ApiError(401, 'Email or password is incorrect.');
  }
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated. Contact the hotel administrator.');

  user.lastLoginAt = new Date();
  await user.save();

  authResponse(res, 200, user);
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// PUT /api/auth/me
export const updateMe = async (req, res) => {
  const updates = pick(req.body, PROFILE_FIELDS);
  if (req.body.marketing !== undefined) updates['consent.marketing'] = Boolean(req.body.marketing);

  if (req.body.avatar !== undefined) updates.avatar = normalizeImage(req.body.avatar);
  const oldAvatar = req.user.avatar?.publicId;

  const user = await User.findById(req.user._id);
  for (const [key, value] of Object.entries(updates)) user.set(key, value);
  await user.save();
  if (updates.avatar !== undefined && oldAvatar && oldAvatar !== user.avatar?.publicId) deleteImage(oldAvatar);
  res.json({ success: true, message: 'Profile updated.', data: user });
};

// PUT /api/auth/me/password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  requireFields(req.body, ['currentPassword', 'newPassword']);

  if (!isStrongPassword(newPassword)) {
    throw new ApiError(400, 'New password must be at least 8 characters and include a letter and a number.');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(String(currentPassword)))) {
    throw new ApiError(400, 'Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();
  sendEmail('passwordChanged', { to: user.email, user });
  // Old tokens are now invalid, so hand back a fresh one for this device
  authResponse(res, 200, user);
};

// POST /api/auth/forgot-password  { email }
// Always answers the same way so nobody can find out which emails have accounts.
export const forgotPassword = async (req, res) => {
  requireFields(req.body, ['email']);
  const email = String(req.body.email).toLowerCase().trim();
  if (!isEmail(email)) throw new ApiError(400, 'Please enter a valid email address.');

  const user = await User.findOne({ email, isActive: true });
  if (user) {
    const token = user.createPasswordResetToken(RESET_MINUTES);
    await user.save({ validateBeforeSave: false });
    await sendEmail('passwordReset', { to: user.email, user, link: `${appUrl()}/reset-password/${token}`, minutes: RESET_MINUTES });
  }

  res.json({ success: true, message: 'If an account exists for this email, a reset link is on its way. Check your inbox and spam folder.' });
};

// POST /api/auth/reset-password/:token  { password }
export const resetPassword = async (req, res) => {
  requireFields(req.body, ['password']);
  if (!isStrongPassword(req.body.password)) {
    throw new ApiError(400, 'Password must be at least 8 characters and include a letter and a number.');
  }

  const user = await User.findOne({
    passwordResetToken: User.hashResetToken(req.params.token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired. Please request a new one.');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated. Contact the hotel administrator.');

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendEmail('passwordChanged', { to: user.email, user });
  res.json({ success: true, message: 'Your password has been reset. You can now log in.' });
};

// GET /api/auth/me/export  — GDPR: download everything we store about you
export const exportMyData = async (req, res) => {
  const id = req.user._id;
  const [bookings, invoices, feedback, requests] = await Promise.all([
    Booking.find({ guest: id }).populate('room', 'roomNumber type').lean(),
    Invoice.find({ guest: id }).lean(),
    Feedback.find({ guest: id }).lean(),
    ServiceRequest.find({ guest: id }).lean(),
  ]);

  res.setHeader('Content-Disposition', 'attachment; filename="luxurystay-my-data.json"');
  res.json({
    exportedAt: new Date().toISOString(),
    profile: req.user,
    bookings,
    invoices,
    feedback,
    serviceRequests: requests,
  });
};

// DELETE /api/auth/me  — guest closes their own account
export const deactivateMe = async (req, res) => {
  if (req.user.role !== 'guest') throw new ApiError(400, 'Staff accounts can only be closed by an administrator.');

  const active = await Booking.exists({ guest: req.user._id, status: { $in: ['confirmed', 'checked-in'] } });
  if (active) throw new ApiError(400, 'Please cancel or complete your active bookings before closing your account.');

  await User.findByIdAndUpdate(req.user._id, { isActive: false, 'consent.marketing': false });
  res.json({ success: true, message: 'Your account has been closed.' });
};
