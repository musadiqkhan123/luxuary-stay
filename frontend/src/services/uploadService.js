import api from './api.js';

const MAX_SIDE = 1800;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const readAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(blob);
  });

// Shrink large photos in the browser before sending them (faster uploads, smaller requests)
const resize = (file) =>
  new Promise((resolve) => {
    if (file.type === 'image/gif') return resolve(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      if (scale === 1 && file.size < 1.5 * 1024 * 1024) return resolve(file);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.86);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

/**
 * Upload one image file to Cloudinary through our API.
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadImage = async (file, folder) => {
  if (!ACCEPTED.includes(file.type)) throw new Error('Please choose a JPG, PNG, WEBP, GIF or AVIF image.');
  if (file.size > 15 * 1024 * 1024) throw new Error('That image is larger than 15 MB.');
  const image = await readAsDataUrl(await resize(file));
  const res = await api.post('/uploads', { image, folder }, { timeout: 60000 });
  return res.data;
};

// Remove an image that was uploaded but never saved
export const deleteUpload = (publicId) => api.delete('/uploads', { data: { publicId } });
