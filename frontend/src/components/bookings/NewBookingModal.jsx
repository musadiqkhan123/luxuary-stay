import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Field from '../ui/Field.jsx';
import Icon from '../ui/Icon.jsx';
import { getUsers, createUser } from '../../services/userService.js';
import { checkAvailability } from '../../services/roomService.js';
import { createBooking } from '../../services/bookingService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ROOM_TYPES } from '../../utils/constants.js';
import { money, toInputDate, addDaysInput, nightsBetween } from '../../utils/format.js';

const blankStay = () => ({ checkIn: toInputDate(), checkOut: addDaysInput(toInputDate(), 1), adults: 1, children: 0, specialRequests: '' });

// Front-desk reservation: pick or create a guest → pick dates → pick a free room
export default function NewBookingModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const { settings } = useSettings();
  const [guest, setGuest] = useState(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [newGuest, setNewGuest] = useState(null);
  const [stay, setStay] = useState(blankStay);
  const [rooms, setRooms] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setGuest(null); setSearch(''); setResults([]); setNewGuest(null);
    setStay(blankStay()); setRooms(null); setRoomId(''); setError('');
  }, [open]);

  // Debounced guest search
  useEffect(() => {
    if (!open || guest || search.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    const t = setTimeout(() => {
      getUsers({ role: 'guest', search, status: 'active', limit: 6 }).then((res) => setResults(res.data)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [search, guest, open]);

  const nights = nightsBetween(stay.checkIn, stay.checkOut);

  const setStayField = (key) => (e) => {
    const value = e.target.value;
    setRooms(null);
    setRoomId('');
    setStay((s) => {
      const next = { ...s, [key]: value };
      if (key === 'checkIn' && next.checkOut <= value) next.checkOut = addDaysInput(value, 1);
      return next;
    });
  };

  const saveNewGuest = async () => {
    setError('');
    try {
      const res = await createUser(newGuest);
      setGuest(res.data);
      setNewGuest(null);
      if (res.tempPassword) toast.info(`${res.message} Email is not set up, so share this temporary password: ${res.tempPassword}`, { autoClose: false });
      else toast.success(res.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const findRooms = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await checkAvailability({ checkIn: stay.checkIn, checkOut: stay.checkOut, guests: Number(stay.adults) + Number(stay.children) });
      setRooms(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await createBooking({ guestId: guest._id, roomId, ...stay });
      toast.success(res.message);
      onCreated(res.data);
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
      size="lg"
      title="New reservation"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!guest || !roomId || busy} onClick={submit}>Confirm reservation</button>
        </>
      }
    >
      <div className="steps">
        <section className="step">
          <h3><span className="step-num">1</span> Guest</h3>
          {guest ? (
            <div className="picked">
              <span><strong>{guest.name}</strong> {guest.email}</span>
              <button className="btn btn-sm btn-ghost" onClick={() => setGuest(null)}>Change</button>
            </div>
          ) : newGuest ? (
            <div className="stack">
              <div className="form-grid form-grid-3">
                <Field label="Full name"><input className="input" value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} /></Field>
                <Field label="Email"><input type="email" className="input" value={newGuest.email} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} /></Field>
                <Field label="Phone"><input className="input" value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} /></Field>
              </div>
              <div className="row">
                <button className="btn btn-sm btn-primary" onClick={saveNewGuest} disabled={!newGuest.name || !newGuest.email}>Save guest</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setNewGuest(null)}>Back to search</button>
              </div>
            </div>
          ) : (
            <div className="stack">
              <div className="search-input">
                <Icon name="search" size={18} />
                <input className="input" placeholder="Search by name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search guests" />
              </div>
              {results.length > 0 && (
                <ul className="pick-list">
                  {results.map((g) => (
                    <li key={g._id}><button onClick={() => setGuest(g)}><strong>{g.name}</strong><span>{g.email}</span></button></li>
                  ))}
                </ul>
              )}
              <button className="btn btn-sm btn-outline" onClick={() => setNewGuest({ name: search, email: '', phone: '' })}>
                <Icon name="plus" size={16} /> New guest profile
              </button>
            </div>
          )}
        </section>

        <section className="step">
          <h3><span className="step-num">2</span> Stay</h3>
          <div className="form-grid form-grid-4">
            <Field label="Arrive"><input type="date" className="input" min={toInputDate()} value={stay.checkIn} onChange={setStayField('checkIn')} /></Field>
            <Field label="Leave"><input type="date" className="input" min={addDaysInput(stay.checkIn, 1)} value={stay.checkOut} onChange={setStayField('checkOut')} /></Field>
            <Field label="Adults"><input type="number" min="1" max="6" className="input" value={stay.adults} onChange={setStayField('adults')} /></Field>
            <Field label="Children"><input type="number" min="0" max="4" className="input" value={stay.children} onChange={setStayField('children')} /></Field>
          </div>
          <button className="btn btn-sm btn-outline" onClick={findRooms} disabled={busy || nights < 1}>
            <Icon name="search" size={16} /> Find free rooms for {nights} night{nights === 1 ? '' : 's'}
          </button>
        </section>

        {rooms && (
          <section className="step">
            <h3><span className="step-num">3</span> Room</h3>
            {rooms.length ? (
              <div className="room-pick" role="radiogroup" aria-label="Available rooms">
                {rooms.map((r) => (
                  <label key={r._id} className={`room-option ${roomId === r._id ? 'is-on' : ''}`}>
                    <input type="radio" name="room" value={r._id} checked={roomId === r._id} onChange={() => setRoomId(r._id)} />
                    <strong>{r.roomNumber}</strong>
                    <span>{ROOM_TYPES[r.type]?.short}</span>
                    <span className="muted">{money(r.pricePerNight * nights, settings.currency)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="muted">No rooms are free for these dates and guest count.</p>
            )}
            <Field label="Special requests">
              <textarea className="input" rows="2" value={stay.specialRequests} onChange={(e) => setStay({ ...stay, specialRequests: e.target.value })} />
            </Field>
          </section>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
