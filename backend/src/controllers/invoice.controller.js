import Invoice from '../models/Invoice.js';
import Setting from '../models/Setting.js';
import ApiError from '../utils/ApiError.js';
import notify from '../utils/notify.js';
import { sendEmail } from '../utils/email.js';
import { PAYMENT_METHODS } from '../constants/index.js';
import { assertObjectId, assertOneOf, requireFields } from '../utils/validate.js';

const POPULATE = [
  { path: 'guest', select: 'name email phone address city country' },
  { path: 'booking', select: 'code checkIn checkOut nights adults children room', populate: { path: 'room', select: 'roomNumber type' } },
  { path: 'issuedBy', select: 'name' },
];

// GET /api/invoices?status=&page=
export const getInvoices = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};
  if (req.user.role === 'guest') filter.guest = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.number = new RegExp(String(req.query.search).replace(/[^A-Za-z0-9-]/g, ''), 'i');

  const [items, total] = await Promise.all([
    Invoice.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Invoice.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: { total, page, pages: Math.ceil(total / limit) || 1, limit } });
};

// GET /api/invoices/:id  — includes hotel details for the printable invoice
export const getInvoice = async (req, res) => {
  assertObjectId(req.params.id, 'invoice ID');
  const invoice = await Invoice.findById(req.params.id).populate(POPULATE);
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  if (req.user.role === 'guest' && String(invoice.guest._id) !== String(req.user._id)) {
    throw new ApiError(404, 'Invoice not found.');
  }
  const settings = await Setting.getSingleton();
  res.json({
    success: true,
    data: {
      invoice,
      hotel: { name: settings.hotelName, email: settings.email, phone: settings.phone, address: settings.address, currency: settings.currency },
    },
  });
};

// POST /api/invoices/:id/payments  { amount, method }
export const addPayment = async (req, res) => {
  requireFields(req.body, ['amount', 'method']);
  assertOneOf(req.body.method, PAYMENT_METHODS, 'Payment method');
  const amount = Number(req.body.amount);
  if (!(amount > 0)) throw new ApiError(400, 'Payment amount must be greater than zero.');

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  if (invoice.status === 'paid') throw new ApiError(400, 'This invoice is already fully paid.');

  const balance = invoice.total - invoice.amountPaid;
  if (amount > balance + 0.001) throw new ApiError(400, `Payment is more than the balance due (${balance.toFixed(2)}).`);

  invoice.payments.push({ amount, method: req.body.method, receivedBy: req.user._id });
  invoice.amountPaid = Math.round((invoice.amountPaid + amount) * 100) / 100;
  invoice.refreshStatus();
  await invoice.save();
  await invoice.populate(POPULATE);
  sendEmail('paymentReceived', { to: invoice.guest.email, invoice, amount, guest: invoice.guest });

  if (invoice.status === 'paid') {
    notify({ users: [invoice.guest._id], title: 'Payment received', message: `Invoice ${invoice.number} is fully paid. Thank you!`, type: 'success', link: `/dashboard/invoices/${invoice._id}` });
  }

  res.json({ success: true, message: `Payment of ${amount} recorded.`, data: invoice });
};
