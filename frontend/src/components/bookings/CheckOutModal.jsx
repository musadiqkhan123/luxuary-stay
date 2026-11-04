import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Field from '../ui/Field.jsx';
import Spinner from '../ui/Spinner.jsx';
import { getBill, checkOut } from '../../services/bookingService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { PAYMENT_METHODS } from '../../utils/constants.js';
import { money } from '../../utils/format.js';

export default function CheckOutModal({ booking, open, onClose, onDone }) {
  const toast = useToast();
  const { settings } = useSettings();
  const [bill, setBill] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState({ amount: '', method: 'card' });
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !booking) return;
    setBill(null); setDiscount(0); setNotes(''); setError('');
    getBill(booking._id)
      .then((res) => {
        setBill(res.data.bill);
        setPayment({ amount: res.data.bill.total, method: 'card' });
      })
      .catch((err) => setError(err.message));
  }, [open, booking]);

  const safeDiscount = bill ? Math.min(Math.max(0, Number(discount) || 0), bill.subtotal) : 0;
  const tax = bill ? Math.round(((bill.subtotal - safeDiscount) * bill.taxRate) / 100) : 0;
  const total = bill ? bill.subtotal - safeDiscount + tax : 0;

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await checkOut(booking._id, { discount: safeDiscount, notes, payment: { amount: Number(payment.amount) || 0, method: payment.method } });
      toast.success(res.message);
      onDone(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={booking ? `Check out ${booking.guest?.name}` : ''}
      subtitle={booking ? `Room ${booking.room?.roomNumber}, booking ${booking.code}` : ''}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!bill || busy} onClick={submit}>{busy ? 'Checking out…' : 'Check out and create invoice'}</button>
        </>
      }
    >
      {!bill && !error ? (
        <Spinner />
      ) : bill ? (
        <div className="stack">
          <table className="table table-compact">
            <tbody>
              {bill.items.map((item, i) => (
                <tr key={i}><td>{item.description}</td><td className="num">{money(item.total, settings.currency)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="field-hint">If the guest leaves early, only the nights actually stayed are charged.</p>
          <div className="form-grid">
            <Field label={`Discount (${settings.currency})`}><input type="number" min="0" className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
            <Field label="Note on invoice"><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></Field>
          </div>
          <dl className="summary">
            <div><dt>Subtotal</dt><dd>{money(bill.subtotal, settings.currency)}</dd></div>
            {safeDiscount > 0 && <div><dt>Discount</dt><dd>−{money(safeDiscount, settings.currency)}</dd></div>}
            <div><dt>Tax ({bill.taxRate}%)</dt><dd>{money(tax, settings.currency)}</dd></div>
            <div className="summary-total"><dt>Total</dt><dd>{money(total, settings.currency)}</dd></div>
          </dl>
          <div className="form-grid">
            <Field label="Payment taken now" hint="Leave 0 to bill later.">
              <input type="number" min="0" className="input" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} />
            </Field>
            <Field label="Method">
              <select className="input" value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}>
                {Object.entries(PAYMENT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>
        </div>
      ) : null}
      {error && <p className="field-error" role="alert">{error}</p>}
    </Modal>
  );
}
