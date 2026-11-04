import mongoose from 'mongoose';
import imageSchema from './schemas/image.js';

// Single document that stores hotel-wide configuration
const settingSchema = new mongoose.Schema(
  {
    hotelName: { type: String, default: 'LuxuryStay Hospitality' },
    email: { type: String, default: 'stay@luxurystay.com' },
    phone: { type: String, default: '+92 21 3456 7890' },
    address: { type: String, default: 'Clifton Block 4, Karachi, Pakistan' },
    heroImage: { type: imageSchema, default: null }, // homepage photo
    currency: { type: String, default: 'PKR' },
    taxRate: { type: Number, default: 16, min: 0, max: 50 },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    roomRates: {
      classic: { type: Number, default: 18000 },
      deluxe: { type: Number, default: 26000 },
      executive: { type: Number, default: 38000 },
      presidential: { type: Number, default: 65000 },
    },
    servicePrices: {
      'room-service': { type: Number, default: 2500 },
      laundry: { type: Number, default: 1500 },
      'wake-up-call': { type: Number, default: 0 },
      transport: { type: Number, default: 4000 },
      spa: { type: Number, default: 7500 },
      housekeeping: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    policies: {
      cancellation: { type: String, default: 'Free cancellation up to 24 hours before arrival.' },
      children: { type: String, default: 'Children under 6 stay free when using existing bedding.' },
      pets: { type: String, default: 'Pets are not allowed, except assistance animals.' },
    },
  },
  { timestamps: true },
);

settingSchema.statics.getSingleton = async function getSingleton() {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

export default mongoose.model('Setting', settingSchema);
