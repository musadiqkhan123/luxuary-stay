import Setting from '../models/Setting.js';
import Room from '../models/Room.js';
import { pick } from '../utils/validate.js';
import ApiError from '../utils/ApiError.js';
import { ROOM_TYPES } from '../constants/index.js';
import { normalizeImage, deleteImage } from '../utils/images.js';

const FIELDS = ['hotelName', 'email', 'phone', 'address', 'currency', 'taxRate', 'checkInTime', 'checkOutTime', 'roomRates', 'servicePrices', 'policies'];
const NESTED = ['roomRates', 'servicePrices', 'policies'];

// GET /api/settings  (public — used for currency, contact details and policies)
export const getSettings = async (req, res) => {
  const settings = await Setting.getSingleton();
  res.json({ success: true, data: settings });
};

// PUT /api/settings
export const updateSettings = async (req, res) => {
  const updates = pick(req.body, FIELDS);
  if (updates.taxRate !== undefined && (Number(updates.taxRate) < 0 || Number(updates.taxRate) > 50)) {
    throw new ApiError(400, 'Tax rate must be between 0 and 50%.');
  }
  const settings = await Setting.getSingleton();

  if (req.body.heroImage !== undefined) {
    const oldId = settings.heroImage?.publicId;
    settings.heroImage = normalizeImage(req.body.heroImage);
    if (oldId && oldId !== settings.heroImage?.publicId) deleteImage(oldId);
  }

  // Set nested keys one by one so a partial update doesn't wipe other keys
  for (const [key, value] of Object.entries(updates)) {
    if (NESTED.includes(key) && value && typeof value === 'object') {
      for (const [subKey, subValue] of Object.entries(value)) settings.set(`${key}.${subKey}`, subValue);
    } else {
      settings.set(key, value);
    }
  }
  await settings.save();
  res.json({ success: true, message: 'Settings saved.', data: settings });
};

// POST /api/settings/apply-room-rates  — push the standard rates to every room of each type
export const applyRoomRates = async (req, res) => {
  const settings = await Setting.getSingleton();
  const results = await Promise.all(
    ROOM_TYPES.map((type) => Room.updateMany({ type }, { pricePerNight: settings.roomRates[type] })),
  );
  const updated = results.reduce((sum, r) => sum + (r.modifiedCount || 0), 0);
  res.json({ success: true, message: `Rates applied. ${updated} room(s) updated. Existing bookings keep their original rate.` });
};
