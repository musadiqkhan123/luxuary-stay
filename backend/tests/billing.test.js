import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBill } from '../src/utils/billing.js';
import { nightsBetween, toDateOnly, addDays } from '../src/utils/dates.js';

test('nightsBetween counts calendar nights', () => {
  assert.equal(nightsBetween('2026-10-01', '2026-10-04'), 3);
  assert.equal(nightsBetween('2026-10-01', '2026-10-01'), 0);
});

test('toDateOnly strips the time part', () => {
  assert.equal(toDateOnly('2026-10-15T18:30:00Z').toISOString(), '2026-10-15T00:00:00.000Z');
  assert.equal(toDateOnly('not a date'), null);
});

test('addDays moves across months', () => {
  assert.equal(addDays(toDateOnly('2026-10-30'), 3).toISOString().slice(0, 10), '2026-11-02');
});

test('buildBill: room nights + services + tax', () => {
  const bill = buildBill({
    checkIn: '2026-10-01',
    checkOut: '2026-10-03',
    ratePerNight: 10000,
    services: [{ type: 'laundry', charge: 1500 }, { type: 'wake-up-call', charge: 0 }],
    taxRate: 16,
  });
  assert.equal(bill.nights, 2);
  assert.equal(bill.items.length, 2); // free wake-up call is not billed
  assert.equal(bill.subtotal, 21500);
  assert.equal(bill.tax, 3440);
  assert.equal(bill.total, 24940);
});

test('buildBill: discount is applied before tax and capped at subtotal', () => {
  const bill = buildBill({ checkIn: '2026-10-01', checkOut: '2026-10-02', ratePerNight: 10000, taxRate: 10, discount: 2000 });
  assert.equal(bill.discount, 2000);
  assert.equal(bill.tax, 800);
  assert.equal(bill.total, 8800);

  const capped = buildBill({ checkIn: '2026-10-01', checkOut: '2026-10-02', ratePerNight: 1000, discount: 5000 });
  assert.equal(capped.discount, 1000);
  assert.equal(capped.total, 0);
});

test('buildBill: same-day stay is charged as one night', () => {
  const bill = buildBill({ checkIn: '2026-10-01', checkOut: '2026-10-01', ratePerNight: 5000 });
  assert.equal(bill.nights, 1);
  assert.equal(bill.total, 5000);
});
