import { nightsBetween } from './dates.js';

const round = (n) => Math.round(n * 100) / 100;

const SERVICE_LABELS = {
  'room-service': 'Room service',
  laundry: 'Laundry',
  'wake-up-call': 'Wake-up call',
  transport: 'Transport',
  spa: 'Spa',
  housekeeping: 'Extra housekeeping',
  other: 'Other service',
};

/**
 * Pure function that builds a bill. Used for the live bill preview and the final invoice.
 * @param {object} p
 * @param {Date} p.checkIn
 * @param {Date} p.checkOut      planned or actual check-out date
 * @param {number} p.ratePerNight
 * @param {string} p.roomLabel
 * @param {Array}  p.services    completed service requests [{ type, details, charge }]
 * @param {number} p.taxRate     percentage, e.g. 16
 * @param {number} p.discount    flat amount
 */
export const buildBill = ({ checkIn, checkOut, ratePerNight, roomLabel = 'Room', services = [], taxRate = 0, discount = 0 }) => {
  const nights = Math.max(1, nightsBetween(checkIn, checkOut));
  const items = [
    {
      description: `${roomLabel} — ${nights} night${nights > 1 ? 's' : ''}`,
      category: 'room',
      quantity: nights,
      unitPrice: ratePerNight,
      total: round(nights * ratePerNight),
    },
  ];

  services
    .filter((s) => Number(s.charge) > 0)
    .forEach((s) => {
      items.push({
        description: `${SERVICE_LABELS[s.type] || s.type}${s.details ? ` (${String(s.details).slice(0, 40)})` : ''}`,
        category: 'service',
        quantity: 1,
        unitPrice: Number(s.charge),
        total: round(Number(s.charge)),
      });
    });

  const subtotal = round(items.reduce((sum, item) => sum + item.total, 0));
  const safeDiscount = Math.min(Math.max(0, Number(discount) || 0), subtotal);
  const taxable = subtotal - safeDiscount;
  const tax = round((taxable * (Number(taxRate) || 0)) / 100);
  const total = round(taxable + tax);

  return { nights, items, subtotal, discount: safeDiscount, taxRate: Number(taxRate) || 0, tax, total };
};
