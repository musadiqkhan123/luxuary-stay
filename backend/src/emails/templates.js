import { layout, button, details, esc } from './layout.js';

const day = (d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const money = (n, cur) => `${cur} ${Math.round(n || 0).toLocaleString('en-US')}`;
const first = (name = '') => esc(name.split(' ')[0] || 'there');
const p = (text) => `<p style="margin:0 0 12px">${text}</p>`;

const ROOM = { classic: 'Classic Room', deluxe: 'Deluxe Room', executive: 'Executive Suite', presidential: 'Presidential Suite' };

// Each template returns { subject, html, text }
export const templates = {
  welcome: ({ hotel, user, appUrl }) => ({
    subject: `Welcome to ${hotel.name}`,
    text: `Hi ${user.name}, your guest account is ready. Book a room at ${appUrl}/rooms`,
    html: layout({
      hotel, preheader: 'Your guest account is ready', heading: `Welcome, ${user.name.split(' ')[0]}`,
      body: p('Your guest account is ready. You can book rooms, request services during your stay and keep all your invoices in one place.') + button(`${appUrl}/rooms`, 'Find a room'),
    }),
  }),

  invitation: ({ hotel, user, link, role }) => ({
    subject: `Set up your ${hotel.name} account`,
    text: `Hi ${user.name}, an account was created for you (${role}). Set your password: ${link} (link valid for 48 hours)`,
    html: layout({
      hotel, preheader: 'Choose a password to activate your account', heading: 'Your account is ready',
      body: p(`Hi ${first(user.name)}, an account has been created for you as <strong>${esc(role)}</strong>.`)
        + p(`Your login email is <strong>${esc(user.email)}</strong>. Choose a password to start:`)
        + button(link, 'Set my password')
        + p('<small style="color:#8a7564">This link works for 48 hours. If it expires, use “Forgot password” on the login page.</small>'),
    }),
  }),

  passwordReset: ({ hotel, user, link, minutes }) => ({
    subject: 'Reset your password',
    text: `Hi ${user.name}, reset your password here: ${link} (valid for ${minutes} minutes). If you did not ask for this, ignore this email.`,
    html: layout({
      hotel, preheader: `This link is valid for ${minutes} minutes`, heading: 'Reset your password',
      body: p(`Hi ${first(user.name)}, we received a request to reset the password for <strong>${esc(user.email)}</strong>.`)
        + button(link, 'Choose a new password')
        + p(`<small style="color:#8a7564">The link is valid for ${minutes} minutes and can be used once. If you did not ask for a reset, you can ignore this email — your password will not change.</small>`),
    }),
  }),

  passwordChanged: ({ hotel, user, appUrl }) => ({
    subject: 'Your password was changed',
    text: `Hi ${user.name}, your password was just changed. If this was not you, reset it now at ${appUrl}/forgot-password`,
    html: layout({
      hotel, preheader: 'Security notice', heading: 'Your password was changed',
      body: p(`Hi ${first(user.name)}, the password for your account was changed on ${esc(new Date().toLocaleString('en-GB'))}.`)
        + p('If this was you, there is nothing else to do. If not, reset your password straight away and contact the hotel.')
        + button(`${appUrl}/forgot-password`, 'Reset my password'),
    }),
  }),

  bookingConfirmed: ({ hotel, booking, appUrl }) => ({
    subject: `Booking confirmed — ${booking.code}`,
    text: `Your booking ${booking.code} is confirmed: room ${booking.room.roomNumber}, ${day(booking.checkIn)} to ${day(booking.checkOut)}.`,
    html: layout({
      hotel, preheader: `${day(booking.checkIn)} to ${day(booking.checkOut)}`, heading: 'Your booking is confirmed',
      body: p(`Hi ${first(booking.guest.name)}, thank you for choosing us. Here are your booking details:`)
        + details([
          ['Booking code', booking.code],
          ['Room', `${ROOM[booking.room.type] || 'Room'} ${booking.room.roomNumber}`],
          ['Arrive', `${day(booking.checkIn)} from ${hotel.checkInTime}`],
          ['Leave', `${day(booking.checkOut)} by ${hotel.checkOutTime}`],
          ['Guests', `${booking.adults} adult(s)${booking.children ? `, ${booking.children} child(ren)` : ''}`],
          ['Room total', `${money(booking.roomTotal, hotel.currency)} + ${hotel.taxRate}% tax`],
          ['Special requests', booking.specialRequests],
        ])
        + button(`${appUrl}/dashboard/bookings/${booking._id}`, 'View my booking')
        + p(`<small style="color:#8a7564">${esc(hotel.cancellationPolicy)}</small>`),
    }),
  }),

  bookingCancelled: ({ hotel, booking }) => ({
    subject: `Booking cancelled — ${booking.code}`,
    text: `Booking ${booking.code} (room ${booking.room.roomNumber}, ${day(booking.checkIn)}) has been cancelled.`,
    html: layout({
      hotel, preheader: booking.code, heading: 'Your booking was cancelled',
      body: p(`Hi ${first(booking.guest.name)}, booking <strong>${esc(booking.code)}</strong> for room ${esc(booking.room.roomNumber)} on ${esc(day(booking.checkIn))} has been cancelled.`)
        + (booking.cancelReason ? p(`Reason: ${esc(booking.cancelReason)}`) : '')
        + p('If you did not expect this, please reply to this email or call the front desk.'),
    }),
  }),

  checkedIn: ({ hotel, booking, appUrl }) => ({
    subject: `Welcome to room ${booking.room.roomNumber}`,
    text: `You are checked in to room ${booking.room.roomNumber}. Key card ${booking.keyCard}. Check-out ${day(booking.checkOut)} by ${hotel.checkOutTime}.`,
    html: layout({
      hotel, preheader: `Key card ${booking.keyCard}`, heading: `Welcome to room ${booking.room.roomNumber}`,
      body: p(`Hi ${first(booking.guest.name)}, you are checked in. Enjoy your stay!`)
        + details([['Room', booking.room.roomNumber], ['Key card', booking.keyCard], ['Check-out', `${day(booking.checkOut)} by ${hotel.checkOutTime}`]])
        + p('Room service, laundry, transport, spa and wake-up calls are one tap away in your dashboard.')
        + button(`${appUrl}/dashboard/services`, 'Request a service'),
    }),
  }),

  invoice: ({ hotel, invoice, booking, appUrl }) => ({
    subject: `Your invoice ${invoice.number}`,
    text: `Thank you for staying with us. Invoice ${invoice.number}: total ${money(invoice.total, hotel.currency)}, balance ${money(invoice.total - invoice.amountPaid, hotel.currency)}.`,
    html: layout({
      hotel, preheader: `Total ${money(invoice.total, hotel.currency)}`, heading: 'Thank you for staying with us',
      body: p(`Hi ${first(booking.guest.name)}, here is the invoice for your stay (booking ${esc(booking.code)}).`)
        + details([
          ...invoice.items.map((i) => [i.description, money(i.total, hotel.currency)]),
          ...(invoice.discount ? [['Discount', `- ${money(invoice.discount, hotel.currency)}`]] : []),
          [`Tax (${invoice.taxRate}%)`, money(invoice.tax, hotel.currency)],
          ['Total', money(invoice.total, hotel.currency)],
          ['Paid', money(invoice.amountPaid, hotel.currency)],
          ['Balance due', money(Math.max(0, invoice.total - invoice.amountPaid), hotel.currency)],
        ])
        + button(`${appUrl}/dashboard/invoices/${invoice._id}`, 'View or print invoice')
        + p('We would love to hear how we did — you can rate your stay from your dashboard.'),
    }),
  }),

  paymentReceived: ({ hotel, invoice, amount, guest, appUrl }) => ({
    subject: `Payment received — ${invoice.number}`,
    text: `We received ${money(amount, hotel.currency)} for invoice ${invoice.number}. Balance: ${money(invoice.total - invoice.amountPaid, hotel.currency)}.`,
    html: layout({
      hotel, preheader: money(amount, hotel.currency), heading: 'Payment received',
      body: p(`Hi ${first(guest.name)}, thank you — we received your payment.`)
        + details([['Invoice', invoice.number], ['Amount', money(amount, hotel.currency)], ['Balance due', money(Math.max(0, invoice.total - invoice.amountPaid), hotel.currency)]])
        + button(`${appUrl}/dashboard/invoices/${invoice._id}`, 'View invoice'),
    }),
  }),

  feedbackReply: ({ hotel, guest, message, appUrl }) => ({
    subject: 'The hotel replied to your feedback',
    text: `Hi ${guest.name}, the hotel replied: ${message}`,
    html: layout({
      hotel, preheader: message.slice(0, 80), heading: 'We replied to your feedback',
      body: p(`Hi ${first(guest.name)}, thank you for your feedback. Our reply:`)
        + `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #b69a7d;background:#f7f3ed;border-radius:0 10px 10px 0">${esc(message)}</blockquote>`
        + button(`${appUrl}/dashboard/feedback`, 'View in my dashboard'),
    }),
  }),
};
