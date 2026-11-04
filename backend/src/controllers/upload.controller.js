import ApiError from '../utils/ApiError.js';
import { uploadImage, deleteImage, ROOT_FOLDER } from '../utils/images.js';
import { requireFields } from '../utils/validate.js';
import { MANAGEMENT } from '../constants/index.js';

// Who may upload into each Cloudinary folder
const FOLDER_ROLES = {
  rooms: MANAGEMENT,
  hotel: ['admin'],
  avatars: ['admin', 'manager', 'receptionist', 'housekeeping', 'guest'],
  maintenance: ['admin', 'manager', 'receptionist', 'housekeeping', 'guest'],
};

// POST /api/uploads  { image: "data:image/jpeg;base64,...", folder: "rooms" }
export const upload = async (req, res) => {
  requireFields(req.body, ['image', 'folder']);
  const { image, folder } = req.body;

  const allowed = FOLDER_ROLES[folder];
  if (!allowed) throw new ApiError(400, `Folder must be one of: ${Object.keys(FOLDER_ROLES).join(', ')}`);
  if (!allowed.includes(req.user.role)) throw new ApiError(403, 'You do not have permission to upload images here.');
  if (!String(image).startsWith('data:image/')) throw new ApiError(400, 'Please send the image as a base64 data URI.');

  const data = await uploadImage(image, folder, String(req.user._id));
  res.status(201).json({ success: true, message: 'Image uploaded.', data });
};

// DELETE /api/uploads  { publicId }  — remove an image that was uploaded but not saved
export const remove = async (req, res) => {
  requireFields(req.body, ['publicId']);
  const { publicId } = req.body;

  if (!String(publicId).startsWith(`${ROOT_FOLDER}/`)) throw new ApiError(400, 'Invalid image id.');
  const ownsIt = String(publicId).includes(`/${req.user._id}-`);
  if (!ownsIt && !MANAGEMENT.includes(req.user.role)) throw new ApiError(403, 'You can only remove images you uploaded.');

  await deleteImage(publicId);
  res.json({ success: true, message: 'Image removed.' });
};
