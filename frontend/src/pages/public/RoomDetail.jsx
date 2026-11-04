import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import RoomImage from '../../components/ui/RoomImage.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import Field from '../../components/ui/Field.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getRoom } from '../../services/roomService.js';
import { createBooking } from '../../services/bookingService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ROOM_TYPES } from '../../utils/constants.js';
import { money, formatDate, toInputDate, addDaysInput, nightsBetween, imageUrl } from '../../utils/format.js';

export default function RoomDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => getRoom(id), [id]);

  const todayStr = toInputDate();
  const [form, setForm] = useState({
    checkIn: params.get('checkIn') || todayStr,
    checkOut: params.get('checkOut') || addDaysInput(todayStr, 1),
    adults: Number(params.get('guests')) || 1,
    children: 0,
    specialRequests: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  if (loading) return <Spinner />;
  if (error) return <div className="container page"><ErrorNote message={error} onRetry={reload} /></div>;

  const { room, booked } = data;
  const type = ROOM_TYPES[room.type];
  const nights = nightsBetween(form.checkIn, form.checkOut);
  const subtotal = nights * room.pricePerNight;
  const tax = Math.round((subtotal * settings.taxRate) / 100);
  const tooMany = Number(form.adults) + Number(form.children) > room.maxGuests;
  const clash = booked.some((b) => form.checkIn < b.checkOut.slice(0, 10) && form.checkOut > b.checkIn.slice(0, 10));

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'checkIn' && next.checkOut <= value) next.checkOut = addDaysInput(value, 1);
      return next;
    });
  };

  const book = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await createBooking({ roomId: room._id, ...form });
      toast.success(res.message);
      navigate(`/dashboard/bookings/${res.data._id}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const loginLink = `/login?redirect=${encodeURIComponent(`/rooms/${room._id}?checkIn=${form.checkIn}&checkOut=${form.checkOut}&guests=${form.adults}`)}`;

  return (
    <div className="container page">
      <Link to="/rooms" className="text-link back-link"><Icon name="back" size={16} /> All rooms</Link>
      <div className="room-detail">
        <div className="room-detail-main">
          <div className="gallery">
            {(room.images?.length ? room.images : ['']).slice(0, 3).map((src, i) => (
              <RoomImage key={i} src={imageUrl(src)} alt={`${type.label} ${room.roomNumber}, photo ${i + 1}`} className={i === 0 ? 'gallery-main' : ''} />
            ))}
          </div>
          <h1 className="room-title">
            {type.label} <span className="room-number">Room {room.roomNumber}</span>
          </h1>
          <ul className="room-specs room-specs-lg">
            <li><Icon name="users" size={18} /> Up to {room.maxGuests} guests</li>
            <li><Icon name="bed" size={18} /> {room.bedType} bed</li>
            <li><Icon name="expand" size={18} /> {room.size} m²</li>
            <li><Icon name="eye" size={18} /> {room.view} view</li>
          </ul>
          <p className="room-description">{room.description}</p>

          <h2 className="subhead">In the room</h2>
          <ul className="amenities">
            {room.amenities.map((a) => <li key={a}><Icon name="check" size={16} /> {a}</li>)}
          </ul>

          {booked.length > 0 && (
            <>
              <h2 className="subhead">Already booked</h2>
              <ul className="booked-list">
                {booked.map((b, i) => <li key={i}>{formatDate(b.checkIn)} to {formatDate(b.checkOut)}</li>)}
              </ul>
            </>
          )}
        </div>

        <aside className="booking-panel">
          <p className="price price-lg">{money(room.pricePerNight, settings.currency)} <span>per night</span></p>
          {user && user.role !== 'guest' ? (
            <p className="note">You are signed in as staff. Create reservations from <Link to="/dashboard/bookings">Reservations</Link>.</p>
          ) : (
            <form onSubmit={book} className="stack">
              <div className="form-grid">
                <Field label="Arrive">
                  <input type="date" className="input" min={todayStr} value={form.checkIn} onChange={set('checkIn')} required />
                </Field>
                <Field label="Leave">
                  <input type="date" className="input" min={addDaysInput(form.checkIn, 1)} value={form.checkOut} onChange={set('checkOut')} required />
                </Field>
                <Field label="Adults">
                  <input type="number" className="input" min="1" max={room.maxGuests} value={form.adults} onChange={set('adults')} />
                </Field>
                <Field label="Children">
                  <input type="number" className="input" min="0" max={room.maxGuests} value={form.children} onChange={set('children')} />
                </Field>
              </div>
              <Field label="Anything we should know?" hint="Optional. Arrival time, dietary needs, celebrations.">
                <textarea className="input" rows="2" value={form.specialRequests} onChange={set('specialRequests')} maxLength={500} />
              </Field>

              {nights > 0 && (
                <dl className="summary">
                  <div><dt>{money(room.pricePerNight, settings.currency)} × {nights} night{nights > 1 ? 's' : ''}</dt><dd>{money(subtotal, settings.currency)}</dd></div>
                  <div><dt>Tax ({settings.taxRate}%)</dt><dd>{money(tax, settings.currency)}</dd></div>
                  <div className="summary-total"><dt>Estimated total</dt><dd>{money(subtotal + tax, settings.currency)}</dd></div>
                </dl>
              )}

              {tooMany && <p className="field-error">This room fits up to {room.maxGuests} guests.</p>}
              {clash && <p className="field-error">The room is already booked for part of these dates.</p>}
              {formError && <p className="field-error" role="alert">{formError}</p>}

              {user ? (
                <button className="btn btn-primary btn-block" disabled={saving || nights < 1 || tooMany || clash}>
                  {saving ? 'Booking…' : 'Confirm booking'}
                </button>
              ) : (
                <Link to={loginLink} className="btn btn-primary btn-block">Log in to book</Link>
              )}
              <p className="fine-print">{settings.policies?.cancellation}</p>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
