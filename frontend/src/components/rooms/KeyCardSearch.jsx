import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { toInputDate, addDaysInput, nightsBetween } from '../../utils/format.js';

// The availability search, styled like a hotel key card
export default function KeyCardSearch({ initial = {} }) {
  const navigate = useNavigate();
  const todayStr = toInputDate();
  const [form, setForm] = useState({
    checkIn: initial.checkIn || todayStr,
    checkOut: initial.checkOut || addDaysInput(todayStr, 2),
    guests: initial.guests || '2',
  });
  const nights = nightsBetween(form.checkIn, form.checkOut);
  const valid = nights > 0 && form.checkIn >= todayStr;

  const update = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'checkIn' && next.checkOut <= value) next.checkOut = addDaysInput(value, 1);
      return next;
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    navigate(`/rooms?${new URLSearchParams(form).toString()}`);
  };

  return (
    <form className="keycard" onSubmit={submit} aria-label="Check availability">
      <div className="keycard-top">
        <span className="keycard-brand">LuxuryStay</span>
        <svg className="keycard-chip" viewBox="0 0 40 30" aria-hidden="true">
          <rect x="1" y="1" width="38" height="28" rx="5" />
          <path d="M1 10h12M1 20h12M27 10h12M27 20h12M13 1v28M27 1v28" />
        </svg>
      </div>
      <div className="keycard-fields">
        <label>
          <span>Arrive</span>
          <input type="date" className="input" value={form.checkIn} min={todayStr} onChange={update('checkIn')} required />
        </label>
        <label>
          <span>Leave</span>
          <input type="date" className="input" value={form.checkOut} min={addDaysInput(form.checkIn, 1)} onChange={update('checkOut')} required />
        </label>
        <label>
          <span>Guests</span>
          <select className="input" value={form.guests} onChange={update('guests')}>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="keycard-bottom">
        <span className="keycard-nights">{valid ? `${nights} night${nights > 1 ? 's' : ''}` : 'Choose your dates'}</span>
        <button className="btn btn-accent" type="submit" disabled={!valid}>
          <Icon name="search" size={18} /> Check availability
        </button>
      </div>
    </form>
  );
}
