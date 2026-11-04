import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Field from '../../components/ui/Field.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getInvoice, addPayment } from '../../services/invoiceService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { FRONT_OFFICE, PAYMENT_METHODS, ROOM_TYPES } from '../../utils/constants.js';
import { money, formatDate, formatDateTime } from '../../utils/format.js';

export default function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => getInvoice(id), [id]);
  const [payment, setPayment] = useState({ amount: '', method: 'cash' });
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const { invoice, hotel } = data;
  const cur = hotel.currency;
  const canTakePayment = FRONT_OFFICE.includes(user.role) && invoice.balance > 0;

  // Email the invoice with the user's own mail app (no email server needed)
  const mailto = (() => {
    const lines = [
      `Dear ${invoice.guest.name},`,
      '',
      `Thank you for staying at ${hotel.name}. Here is invoice ${invoice.number} for booking ${invoice.booking?.code}.`,
      '',
      ...invoice.items.map((i) => `${i.description}: ${money(i.total, cur)}`),
      invoice.discount ? `Discount: -${money(invoice.discount, cur)}` : '',
      `Tax (${invoice.taxRate}%): ${money(invoice.tax, cur)}`,
      `Total: ${money(invoice.total, cur)}`,
      `Paid: ${money(invoice.amountPaid, cur)}`,
      `Balance: ${money(invoice.balance, cur)}`,
      '',
      hotel.name,
      hotel.phone,
    ].filter((l) => l !== '');
    return `mailto:${invoice.guest.email}?subject=${encodeURIComponent(`Invoice ${invoice.number} — ${hotel.name}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
  })();

  const pay = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await addPayment(invoice._id, { amount: Number(payment.amount), method: payment.method });
      toast.success(res.message);
      setPayment({ amount: '', method: 'cash' });
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="no-print invoice-toolbar">
        <Link to="/dashboard/invoices" className="text-link back-link"><Icon name="back" size={16} /> Invoices</Link>
        <div className="row">
          <a href={mailto} className="btn btn-outline"><Icon name="mail" size={16} /> Email</a>
          <button className="btn btn-primary" onClick={() => window.print()}><Icon name="printer" size={16} /> Print or save as PDF</button>
        </div>
      </div>

      <article className="invoice">
        <header className="invoice-head">
          <div>
            <p className="invoice-hotel">{hotel.name}</p>
            <p>{hotel.address}</p>
            <p>{hotel.phone}, {hotel.email}</p>
          </div>
          <div className="invoice-meta">
            <h1>Invoice</h1>
            <p className="mono">{invoice.number}</p>
            <p>Issued {formatDate(invoice.createdAt)}</p>
            <Badge status={invoice.status} />
          </div>
        </header>

        <section className="invoice-parties">
          <div>
            <h2>Billed to</h2>
            <p><strong>{invoice.guest.name}</strong></p>
            <p>{invoice.guest.email}</p>
            {invoice.guest.phone && <p>{invoice.guest.phone}</p>}
            {(invoice.guest.address || invoice.guest.city) && <p>{[invoice.guest.address, invoice.guest.city, invoice.guest.country].filter(Boolean).join(', ')}</p>}
          </div>
          <div>
            <h2>Stay</h2>
            <p>Booking <span className="mono">{invoice.booking?.code}</span></p>
            <p>Room {invoice.booking?.room?.roomNumber}, {ROOM_TYPES[invoice.booking?.room?.type]?.label}</p>
            <p>{formatDate(invoice.booking?.checkIn)} to {formatDate(invoice.booking?.checkOut)}</p>
          </div>
        </section>

        <table className="table invoice-table">
          <thead><tr><th>Description</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Amount</th></tr></thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}><td>{item.description}</td><td className="num">{item.quantity}</td><td className="num">{money(item.unitPrice, cur)}</td><td className="num">{money(item.total, cur)}</td></tr>
            ))}
          </tbody>
        </table>

        <dl className="summary invoice-summary">
          <div><dt>Subtotal</dt><dd>{money(invoice.subtotal, cur)}</dd></div>
          {invoice.discount > 0 && <div><dt>Discount</dt><dd>−{money(invoice.discount, cur)}</dd></div>}
          <div><dt>Tax ({invoice.taxRate}%)</dt><dd>{money(invoice.tax, cur)}</dd></div>
          <div className="summary-total"><dt>Total</dt><dd>{money(invoice.total, cur)}</dd></div>
          <div><dt>Paid</dt><dd>{money(invoice.amountPaid, cur)}</dd></div>
          <div className="summary-total"><dt>Balance due</dt><dd>{money(invoice.balance, cur)}</dd></div>
        </dl>

        {invoice.payments.length > 0 && (
          <section className="invoice-payments">
            <h2>Payments</h2>
            <ul>
              {invoice.payments.map((p, i) => (
                <li key={i}>{formatDateTime(p.paidAt)}: {money(p.amount, cur)} by {PAYMENT_METHODS[p.method]}</li>
              ))}
            </ul>
          </section>
        )}
        {invoice.notes && <p className="note">{invoice.notes}</p>}
        <p className="invoice-thanks">Thank you for staying with us.</p>
      </article>

      {canTakePayment && (
        <form className="panel no-print payment-form" onSubmit={pay}>
          <h2>Record a payment</h2>
          <div className="form-grid form-grid-3">
            <Field label={`Amount (balance ${money(invoice.balance, cur)})`}>
              <input type="number" min="1" max={invoice.balance} step="0.01" className="input" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} required />
            </Field>
            <Field label="Method">
              <select className="input" value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}>
                {Object.entries(PAYMENT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <div className="field field-end">
              <button className="btn btn-primary" disabled={busy}>Record payment</button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
