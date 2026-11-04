import User from '../models/User.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ALL_ROLES } from '../constants/index.js';
import { requireFields, pick, isEmail, isStrongPassword, assertOneOf } from '../utils/validate.js';
import { tempPassword } from '../utils/codes.js';
import { normalizeImage, deleteImage } from '../utils/images.js';
import { sendEmail, appUrl } from '../utils/email.js';
import { ROLE_LABELS } from '../constants/index.js';

const GUEST_FIELDS = ['name', 'email', 'phone', 'address', 'city', 'country', 'preferences'];
const STAFF_FIELDS = [...GUEST_FIELDS, 'jobTitle', 'role', 'isActive'];

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/users?role=guest&search=ali&status=active&page=1&limit=20
export const listUsers = async (req, res) => {
  const { role, search, status } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const filter = {};
  // Only admins can see staff accounts; others can only list guests
  if (req.user.role === 'admin') {
    if (role === 'staff') filter.role = { $ne: 'guest' };
    else if (role) filter.role = role;
  } else {
    filter.role = 'guest';
  }
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { total, page, pages: Math.ceil(total / limit) || 1, limit } });
};

// GET /api/users/permissions
export const getPermissions = async (req, res) => {
  res.json({ success: true, data: PERMISSIONS });
};

// GET /api/users/:id
export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (req.user.role !== 'admin' && user.role !== 'guest') throw new ApiError(403, 'You can only view guest profiles.');

  const bookings = await Booking.find({ guest: user._id })
    .populate('room', 'roomNumber type')
    .sort({ checkIn: -1 })
    .limit(20);

  res.json({ success: true, data: { user, bookings } });
};

// POST /api/users  — admin creates staff/guests, front office creates walk-in guests
export const createUser = async (req, res) => {
  requireFields(req.body, ['name', 'email']);
  const { email } = req.body;
  if (!isEmail(email)) throw new ApiError(400, 'Please enter a valid email address.');

  const isAdmin = req.user.role === 'admin';
  const role = isAdmin ? req.body.role || 'guest' : 'guest';
  assertOneOf(role, ALL_ROLES, 'Role');

  let password = req.body.password;
  let generated = false;
  if (!password) {
    password = tempPassword();
    generated = true;
  } else if (!isStrongPassword(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters and include a letter and a number.');
  }

  const data = pick(req.body, isAdmin ? STAFF_FIELDS : GUEST_FIELDS);
  if (req.body.avatar) data.avatar = normalizeImage(req.body.avatar);
  const user = await User.create({
    ...data,
    role,
    password,
    consent: role === 'guest' ? { privacyAccepted: true, acceptedAt: new Date() } : undefined,
  });

  // No password chosen → email a "set your password" link (valid 48 hours)
  let invited = false;
  if (generated) {
    const token = user.createPasswordResetToken(48 * 60);
    await user.save({ validateBeforeSave: false });
    invited = await sendEmail('invitation', { to: user.email, user, role: ROLE_LABELS[role], link: `${appUrl()}/reset-password/${token}` });
  }

  const label = role === 'guest' ? 'Guest profile' : 'Staff account';
  res.status(201).json({
    success: true,
    message: invited ? `${label} created. An email was sent to ${user.email} to set a password.` : `${label} created.`,
    data: user,
    // Only when email is not set up, so the admin can still pass the login on
    ...(generated && !invited ? { tempPassword: password } : {}),
  });
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && user.role !== 'guest') throw new ApiError(403, 'You can only edit guest profiles.');

  const updates = pick(req.body, isAdmin ? STAFF_FIELDS : GUEST_FIELDS);
  if (updates.role) assertOneOf(updates.role, ALL_ROLES, 'Role');
  if (String(user._id) === String(req.user._id) && ((updates.role && updates.role !== user.role) || updates.isActive === false)) {
    throw new ApiError(400, 'You cannot change your own role or deactivate yourself.');
  }
  if (updates.email && !isEmail(updates.email)) throw new ApiError(400, 'Please enter a valid email address.');

  const oldAvatar = user.avatar?.publicId;
  if (req.body.avatar !== undefined) updates.avatar = normalizeImage(req.body.avatar);
  Object.assign(user, updates);
  if (updates.avatar !== undefined && oldAvatar && oldAvatar !== user.avatar?.publicId) deleteImage(oldAvatar);
  if (req.body.password && isAdmin) {
    if (!isStrongPassword(req.body.password)) {
      throw new ApiError(400, 'Password must be at least 8 characters and include a letter and a number.');
    }
    user.password = req.body.password;
  }
  await user.save();

  res.json({ success: true, message: 'Profile updated.', data: user });
};

// POST /api/users/:id/send-reset  — admin emails a password reset link to a user
export const sendPasswordReset = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (!user.isActive) throw new ApiError(400, 'Activate the account first.');

  const token = user.createPasswordResetToken(24 * 60);
  await user.save({ validateBeforeSave: false });
  const sent = await sendEmail('passwordReset', { to: user.email, user, link: `${appUrl()}/reset-password/${token}`, minutes: 24 * 60 });
  if (!sent) throw new ApiError(503, 'Email is not set up on the server. Add the SMTP keys to backend/.env.');

  res.json({ success: true, message: `Password reset link sent to ${user.email}.` });
};

// PATCH /api/users/:id/status  — activate / deactivate (admin)
export const setUserStatus = async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') throw new ApiError(400, 'isActive must be true or false.');
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'You cannot deactivate your own account.');

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) throw new ApiError(404, 'User not found.');

  res.json({ success: true, message: isActive ? 'Account activated.' : 'Account deactivated.', data: user });
};
