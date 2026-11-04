import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Field from '../../components/ui/Field.jsx';
import CheckOutModal from '../../components/bookings/CheckOutModal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getBooking, getBill, checkIn, cancelBooking, updateBooking } from '../../services/bookingService.js';
import { checkAvailability } from '../../services/roomService.js';
import { createServiceRequest, updateServiceRequest } from '../../services/serviceRequestService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { FRONT_OFFICE, ROOM_TYPES, SERVICE_TYPES } from '../../utils/constants.js';
import { money, formatDate, formatDateTime, toInputDate, addDaysInput } from '../../utils/format.js';

export default function BookingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { settings } = useSettings();
  const { data, loading, error, reload } = useFetch(() => getBooking(id), [id]);
  const [bill, setBill] = useState(null);
  const [modal, setModal] = useState(''); // 'checkout' | 'cancel' | 'edit' | 'charge'
  const [busy, setBusy] = useState(false);

  const booking = data?.booking;
  const isFrontOffice = FRONT_OFFICE.includes(user.role);

  // Live bill for in-house guests
  useEffect(() => {
    if (booking?.status === 'checked-in') getBill(booking._id).then((res) => setBill(res.data.bill)).catch(() => {});
    else setBill(null);
  }, [booking?._id, booking?.status, data?.services?.length]);

  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const { services, invoice } = data;
  const todayStr = toInputDate();
  const arrivalDue = booking.status === 'confirmed' && booking.checkIn.slice(0, 10) <= todayStr;

  const run = async (fn) => {
    setBusy(true);
    try {
      const res = await fn();
      toast.success(res.message);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/dashboard/bookings" className="text-link back-link"><Icon name="back" size={16} /> {user.role === 'guest' ? 'My bookings' : 'Reservations'}</Link>
      <div className="page-header">
        <div>
          <h1 className="with-badge">Booking <span className="mono">{booking.code}</span> <Badge status={booking.status} /></h1>
          <p className="muted">Made {formatDateTime(booking.createdAt)} {booking.source === 'online' ? 'online' : 'at the front desk'}</p>
        </div>
        <div className="page-actions">
          {isFrontOffice && booking.status === 'confirmed' && (
            <>
              <button className="btn btn-outline" onClick={() => setModal('edit')}><Icon name="edit" size={16} /> Change</button>
              <button className="btn btn-primary" disabled={!arrivalDue || busy} title={arrivalDue ? '' : 'Available on the arrival date'} onClick={() => run(() => checkIn(booking._id, {}))}>
                <Icon name="key" size={16} /> Check in
              </button>
            </>
          )}
          {isFrontOffice && booking.status === 'checked-in' && (
            <>
              <button className="btn btn-outline" onClick={() => setModal('charge')}><Icon name="plus" size={16} /> Add charge</button>
              <button className="btn btn-primary" onClick={() => setModal('checkout')}><Icon name="logout" size={16} /> Check out</button>
            </>
          )}
          {booking.status === 'confirmed' && (isFrontOffice || booking.checkIn.slice(0, 10) > todayStr) && (
            <button className="btn btn-ghost btn-danger-text" onClick={() => setModal('cancel')}>Cancel booking</button>
          )}
          {invoice && <Link to={`/dashboard/invoices/${invoice._id}`} className="btn btn-primary"><Icon name="receipt" size={16} /> View invoice</Link>}
        </div>
      </div>

      <div className="grid-2 grid-wide-left">
        <div className="stack-lg">
          <section className="panel">
            <div className="panel-head"><h2>Stay</h2></div>
            <dl className="kv kv-2">
              <div><dt>Arrive</dt><dd>{formatDate(booking.checkIn, { weekday: 'short' })} from {settings.checkInTime}</dd></div>
              <div><dt>Leave</dt><dd>{formatDate(booking.checkOut, { weekday: 'short' })} by {settings.checkOutTime}</dd></div>
              <div><dt>Room</dt><dd>{booking.room.roomNumber}, {ROOM_TYPES[booking.room.type]?.label}</dd></div>
              <div><dt>Guests</dt><dd>{booking.adults} adult{booking.adults > 1 ? 's' : ''}{booking.children ? `, ${booking.children} child${booking.children > 1 ? 'ren' : ''}` : ''}</dd></div>
              <div><dt>Rate</dt><dd>{money(booking.ratePerNight, settings.currency)} × {booking.nights} night{booking.nights > 1 ? 's' : ''}</dd></div>
              <div><dt>Room total</dt><dd>{money(booking.roomTotal, settings.currency)}</dd></div>
              {booking.keyCard && <div><dt>Key card</dt><dd className="mono">{booking.keyCard}</dd></div>}
              {booking.checkedInAt && <div><dt>Checked in</dt><dd>{formatDateTime(booking.checkedInAt)}</dd></div>}
              {booking.checkedOutAt && <div><dt>Checked out</dt><dd>{formatDateTime(booking.checkedOutAt)}</dd></div>}
              {booking.cancelReason && <div><dt>Cancel reason</dt><dd>{booking.cancelReason}</dd></div>}
            </dl>
            {booking.specialRequests && <p className="note"><strong>Requests:</strong> {booking.specialRequests}</p>}
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Services during this stay</h2></div>
            {services.length ? (
              <ul className="line-list">
                {services.map((s) => (
                  <li key={s._id}>
                    <span>{SERVICE_TYPES[s.type]}{s.details ? <span className="cell-sub">{s.details}</span> : null}</span>
                    <Badge status={s.status} />
                    <span className="num">{s.charge ? money(s.charge, settings.currency) : 'Free'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No services requested.</p>
            )}
          </section>
        </div>

        <div className="stack-lg">
          {isFrontOffice && (
            <section className="panel">
              <div className="panel-head"><h2>Guest</h2></div>
              <dl className="kv">
                <div><dt>Name</dt><dd>{booking.guest.name}</dd></div>
                <div><dt>Email</dt><dd><a href={`mailto:${booking.guest.email}`}>{booking.guest.email}</a></dd></div>
                <div><dt>Phone</dt><dd>{booking.guest.phone || '—'}</dd></div>
              </dl>
            </section>
          )}

          {bill && (
            <section className="panel">
              <div className="panel-head"><h2>Running bill</h2></div>
              <ul className="line-list">
                {bill.items.map((item, i) => (
                  <li key={i}><span>{item.description}</span><span className="num">{money(item.total, settings.currency)}</span></li>
                ))}
              </ul>
              <dl className="summary">
                <div><dt>Tax ({bill.taxRate}%)</dt><dd>{money(bill.tax, settings.currency)}</dd></div>
                <div className="summary-total"><dt>Total so far</dt><dd>{money(bill.total, settings.currency)}</dd></div>
              </dl>
            </section>
          )}

          {invoice && (
            <section className="panel">
              <div className="panel-head"><h2>Invoice</h2><Badge status={invoice.status} /></div>
              <dl className="kv">
                <div><dt>Number</dt><dd className="mono">{invoice.number}</dd></div>
                <div><dt>Total</dt><dd>{money(invoice.total, settings.currency)}</dd></div>
                <div><dt>Balance</dt><dd>{money(invoice.balance, settings.currency)}</dd></div>
              </dl>
            </section>
          )}

          {user.role === 'guest' && booking.status === 'checked-out' && (
            <Link to={`/dashboard/feedback?booking=${booking._id}`} className="btn btn-outline btn-block"><Icon name="star" size={16} /> Rate this stay</Link>
          )}
        </div>
      </div>

      <CheckOutModal booking={booking} open={modal === 'checkout'} onClose={() => setModal('')} onDone={() => { setModal(''); reload(); }} />
      <CancelModal open={modal === 'cancel'} booking={booking} isFrontOffice={isFrontOffice} onClose={() => setModal('')} onDone={() => { setModal(''); reload(); }} />
      {isFrontOffice && <EditBookingModal open={modal === 'edit'} booking={booking} onClose={() => setModal('')} onDone={() => { setModal(''); reload(); }} />}
      {isFrontOffice && <ChargeModal open={modal === 'charge'} booking={booking} onClose={() => setModal('')} onDone={() => { setModal(''); reload(); }} />}
    </>
  );
}

function CancelModal({ open, booking, isFrontOffice, onClose, onDone }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [noShow, setNoShow] = useState(false);
  const pastArrival = booking.checkIn.slice(0, 10) < toInputDate();

  const submit = async () => {
    try {
      const res = await cancelBooking(booking._id, { reason, noShow });
      toast.success(res.message);
      onDone();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Cancel booking ${booking.code}?`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Keep booking</button>
          <button className="btn btn-danger" onClick={submit}>{noShow ? 'Mark as no-show' : 'Cancel booking'}</button>
        </>
      }
    >
      <div className="stack">
        <Field label="Reason" hint="Optional"><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} /></Field>
        {isFrontOffice && pastArrival && (
          <label className="checkbox"><input type="checkbox" checked={noShow} onChange={(e) => setNoShow(e.target.checked)} /><span>The guest did not arrive (no-show)</span></label>
        )}
      </div>
    </Modal>
  );
}

function EditBookingModal({ open, booking, onClose, onDone }) {
  const toast = useToast();
  const { settings } = useSettings();
  const [form, setForm] = useState({});
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      checkIn: booking.checkIn.slice(0, 10),
      checkOut: booking.checkOut.slice(0, 10),
      adults: booking.adults,
      children: booking.children,
      specialRequests: booking.specialRequests,
      roomId: booking.room._id,
    });
  }, [open, booking]);

  // Rooms free for the chosen dates (plus the current room)
  useEffect(() => {
    if (!open || !form.checkIn || !form.checkOut || form.checkOut <= form.checkIn) return;
    checkAvailability({ checkIn: form.checkIn, checkOut: form.checkOut })
      .then((res) => setRooms(res.data))
      .catch(() => setRooms([]));
  }, [open, form.checkIn, form.checkOut]);

  const set = (key) => (e) => setForm((f) => {
    const next = { ...f, [key]: e.target.value };
    if (key === 'checkIn' && next.checkOut <= next.checkIn) next.checkOut = addDaysInput(next.checkIn, 1);
    return next;
  });

  const options = [booking.room, ...rooms.filter((r) => r._id !== booking.room._id)];

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await updateBooking(booking._id, form);
      toast.success(res.message);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Change booking ${booking.code}`}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Close</button><button className="btn btn-primary" type="submit" form="edit-booking">Save changes</button></>}
    >
      <form id="edit-booking" onSubmit={submit} className="stack">
        <div className="form-grid">
          <Field label="Arrive"><input type="date" className="input" min={toInputDate()} value={form.checkIn || ''} onChange={set('checkIn')} /></Field>
          <Field label="Leave"><input type="date" className="input" value={form.checkOut || ''} onChange={set('checkOut')} /></Field>
          <Field label="Adults"><input type="number" min="1" className="input" value={form.adults || 1} onChange={set('adults')} /></Field>
          <Field label="Children"><input type="number" min="0" className="input" value={form.children ?? 0} onChange={set('children')} /></Field>
        </div>
        <Field label="Room" hint="Only rooms free for these dates are listed. Changing room uses the new room's rate.">
          <select className="input" value={form.roomId || ''} onChange={set('roomId')}>
            {options.map((r) => (
              <option key={r._id} value={r._id}>
                {r.roomNumber} — {ROOM_TYPES[r.type]?.short}, {money(r.pricePerNight, settings.currency)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Special requests"><textarea className="input" rows="2" value={form.specialRequests || ''} onChange={set('specialRequests')} /></Field>
        {error && <p className="field-error" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}

function ChargeModal({ open, booking, onClose, onDone }) {
  const toast = useToast();
  const { settings } = useSettings();
  const [form, setForm] = useState({ type: 'room-service', details: '', charge: '' });

  useEffect(() => {
    if (open) setForm({ type: 'room-service', details: '', charge: settings.servicePrices?.['room-service'] ?? '' });
  }, [open, settings.servicePrices]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const created = await createServiceRequest({ bookingId: booking._id, type: form.type, details: form.details, charge: Number(form.charge) || 0 });
      await updateServiceRequest(created.data._id, { status: 'completed' });
      toast.success('Charge added to the bill.');
      onDone();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a charge to the bill"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" form="charge-form">Add charge</button></>}
    >
      <form id="charge-form" onSubmit={submit} className="stack">
        <div className="form-grid">
          <Field label="Service">
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, charge: settings.servicePrices?.[e.target.value] ?? 0 })}>
              {Object.entries(SERVICE_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label={`Amount (${settings.currency})`}><input type="number" min="0" className="input" value={form.charge} onChange={(e) => setForm({ ...form, charge: e.target.value })} required /></Field>
        </div>
        <Field label="Details"><input className="input" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="e.g. Mini bar: 2 juices" /></Field>
      </form>
    </Modal>
  );
}
