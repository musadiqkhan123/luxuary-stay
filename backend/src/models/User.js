import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ALL_ROLES, ROOM_TYPES } from '../constants/index.js';
import imageSchema from './schemas/image.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please enter a valid email address'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ALL_ROLES, default: 'guest' },
    phone: { type: String, trim: true, maxlength: 25, default: '' },
    isActive: { type: Boolean, default: true },
    avatar: { type: imageSchema, default: null }, // profile photo on Cloudinary

    // Staff details
    jobTitle: { type: String, trim: true, maxlength: 60, default: '' },

    // Guest profile details
    address: { type: String, trim: true, maxlength: 200, default: '' },
    city: { type: String, trim: true, maxlength: 60, default: '' },
    country: { type: String, trim: true, maxlength: 60, default: '' },
    preferences: {
      roomType: { type: String, enum: [...ROOM_TYPES, ''], default: '' },
      bedType: { type: String, enum: ['', 'king', 'queen', 'twin'], default: '' },
      floor: { type: String, enum: ['', 'low', 'high'], default: '' },
      dietary: { type: String, trim: true, maxlength: 120, default: '' },
      notes: { type: String, trim: true, maxlength: 500, default: '' },
    },

    // Privacy / GDPR consent
    consent: {
      privacyAccepted: { type: Boolean, default: false },
      acceptedAt: { type: Date },
      marketing: { type: Boolean, default: false },
    },

    lastLoginAt: { type: Date },

    // Password reset (only a SHA-256 hash of the emailed token is stored)
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, isActive: 1 });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  // Tokens issued before this moment stop working (logs out other devices)
  if (!this.isNew) this.passwordChangedAt = new Date();
});

// Creates a reset token: the plain token is emailed, only its hash is saved
userSchema.methods.createPasswordResetToken = function createPasswordResetToken(minutes = 30) {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + minutes * 60 * 1000);
  return token;
};

userSchema.statics.hashResetToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
