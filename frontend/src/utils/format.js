export const money = (amount = 0, currency = 'PKR') => {
  try {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `${currency} ${Math.round(amount || 0).toLocaleString()}`;
  }
};

// Stay dates are stored as UTC midnight, so format them in UTC to avoid off-by-one days
export const formatDate = (value, opts = {}) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', ...opts })
    : '—';

export const formatShortDate = (value) => formatDate(value, { year: undefined });

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const timeAgo = (value) => {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
};

// YYYY-MM-DD in the user's local timezone
export const toInputDate = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const addDaysInput = (input, days) => {
  const [y, m, d] = input.split('-').map(Number);
  return toInputDate(new Date(y, m - 1, d + days));
};

export const nightsBetween = (a, b) => {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(`${b.slice(0, 10)}T00:00:00Z`) - new Date(`${a.slice(0, 10)}T00:00:00Z`)) / 86400000));
};

// Images are stored as { url, publicId } (Cloudinary); older data may be plain strings
export const imageUrl = (img) => (typeof img === 'string' ? img : img?.url || '');

export const titleCase = (text = '') => text.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

export const downloadFile = (filename, content, type = 'application/json') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
