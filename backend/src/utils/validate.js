import mongoose from 'mongoose';
import ApiError from './ApiError.js';

export const requireFields = (body, fields) => {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) {
    throw new ApiError(400, `Please provide: ${missing.join(', ')}`);
  }
};

// Copy only whitelisted keys (protects against mass-assignment)
export const pick = (source = {}, keys = []) =>
  keys.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});

export const isEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());

export const isStrongPassword = (value = '') =>
  String(value).length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

export const assertObjectId = (id, label = 'ID') => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label}.`);
};

export const assertOneOf = (value, allowed, label) => {
  if (value !== undefined && !allowed.includes(value)) {
    throw new ApiError(400, `${label} must be one of: ${allowed.join(', ')}`);
  }
};
