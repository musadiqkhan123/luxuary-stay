import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const randomCode = (length = 6) => {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
};

export const bookingCode = () => `LS-${randomCode(6)}`;

export const invoiceNumber = () => {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `INV-${stamp}-${randomCode(4)}`;
};

export const keyCardNumber = (roomNumber) => `KC-${roomNumber}-${randomCode(4)}`;

export const tempPassword = () => `Ls${randomCode(6)}9`;
