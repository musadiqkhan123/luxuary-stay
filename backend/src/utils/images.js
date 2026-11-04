import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import ApiError from './ApiError.js';
import logger from './logger.js';

export const ROOT_FOLDER = 'luxurystay';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const DATA_URI = /^data:image\/(png|jpe?g|webp|gif|avif);base64,/i;

/**
 * Uploads an image to Cloudinary.
 * @param {string} source  a base64 data URI (from the browser) or a remote https URL (used by the seeder)
 * @param {string} folder  sub-folder, e.g. "rooms"
 * @param {string} prefix  public id prefix (the uploader's user id) so we know who owns the file
 * @returns {{ url: string, publicId: string }}
 */
export const uploadImage = async (source, folder, prefix = 'system') => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, 'Image uploads are not set up. Add your Cloudinary keys to backend/.env and restart the server.');
  }
  const isDataUri = DATA_URI.test(source || '');
  if (!isDataUri && !/^https:\/\//.test(source || '')) {
    throw new ApiError(400, 'Please choose a PNG, JPG, WEBP, GIF or AVIF image.');
  }
  if (isDataUri) {
    const bytes = Math.ceil(((source.length - source.indexOf(',') - 1) * 3) / 4);
    if (bytes > MAX_IMAGE_BYTES) throw new ApiError(413, 'Image is larger than 5 MB. Please choose a smaller file.');
  }

  try {
    const result = await cloudinary.uploader.upload(source, {
      folder: `${ROOT_FOLDER}/${folder}`,
      public_id: `${prefix}-${Date.now()}`,
      resource_type: 'image',
      overwrite: false,
      transformation: [{ width: 1800, height: 1800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    logger.error(`Cloudinary upload failed: ${error.message}`);
    throw new ApiError(502, 'The image could not be uploaded to Cloudinary. Check your Cloudinary keys and internet connection.');
  }
};

// Deletes one image from Cloudinary. Never throws — a cleanup failure must not break the request.
export const deleteImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    logger.warn(`Could not delete image ${publicId}: ${error.message}`);
  }
};

export const deleteImages = (images = []) => Promise.all(images.map((img) => deleteImage(img?.publicId)));

// Accepts ["https://..."] or [{ url, publicId }] and returns clean { url, publicId } objects
export const normalizeImages = (list, max = 8) => {
  if (list === undefined) return undefined;
  if (!Array.isArray(list)) throw new ApiError(400, 'Images must be a list.');
  return list
    .map((item) => (typeof item === 'string' ? { url: item, publicId: '' } : { url: item?.url, publicId: item?.publicId || '' }))
    .filter((img) => typeof img.url === 'string' && /^https?:\/\//.test(img.url))
    .slice(0, max);
};

export const normalizeImage = (item) => {
  if (item === undefined) return undefined;
  if (item === null || item === '') return null;
  const [img] = normalizeImages([item], 1);
  if (!img) throw new ApiError(400, 'Invalid image.');
  return img;
};

// publicIds that were in `before` but are not in `after`
export const removedPublicIds = (before = [], after = []) => {
  const keep = new Set(after.map((i) => i?.publicId).filter(Boolean));
  return before.map((i) => i?.publicId).filter((id) => id && !keep.has(id));
};
