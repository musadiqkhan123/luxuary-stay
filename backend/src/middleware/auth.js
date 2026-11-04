import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

// Verifies the Bearer token and attaches the logged-in user to req.user
export const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) throw new ApiError(401, 'Please log in to continue.');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) throw new ApiError(401, 'This account no longer exists.');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated. Contact the hotel administrator.');
  // JWT iat is in whole seconds, so compare seconds (a token made right after the change stays valid)
  if (user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    throw new ApiError(401, 'Your password was changed. Please log in again.');
  }

  req.user = user;
  next();
};

// Role-based access control: authorize('admin', 'manager')
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, 'You do not have permission to perform this action.');
  }
  next();
};

// For public routes that show extra data to logged-in staff (e.g. room list)
export const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user?.isActive) req.user = user;
  } catch {
    // invalid token on a public route → treat as anonymous visitor
  }
  next();
};
