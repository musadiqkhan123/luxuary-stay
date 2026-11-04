const DAY_MS = 24 * 60 * 60 * 1000;

// All stay dates are stored as midnight UTC of the calendar day (YYYY-MM-DD).
export const toDateOnly = (value) => {
  if (!value) return null;
  const str = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  const date = new Date(`${str}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

// "Today" in the server's local timezone, as a date-only value
export const today = () => toDateOnly(new Date().toLocaleDateString('en-CA'));

export const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

export const nightsBetween = (checkIn, checkOut) =>
  Math.max(0, Math.round((toDateOnly(checkOut) - toDateOnly(checkIn)) / DAY_MS));

export const isSameDay = (a, b) => toDateOnly(a)?.getTime() === toDateOnly(b)?.getTime();

export const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);
