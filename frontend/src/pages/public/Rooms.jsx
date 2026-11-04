import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import RoomCard from '../../components/rooms/RoomCard.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getRooms, checkAvailability } from '../../services/roomService.js';
import { ROOM_TYPES } from '../../utils/constants.js';
import { toInputDate, addDaysInput, nightsBetween, formatDate } from '../../utils/format.js';

export default function Rooms() {
  const [params, setParams] = useSearchParams();
  const filters = {
    checkIn: params.get('checkIn') || '',
    checkOut: params.get('checkOut') || '',
    guests: params.get('guests') || '',
    type: params.get('type') || '',
  };
  const hasDates = filters.checkIn && filters.checkOut && nightsBetween(filters.checkIn, filters.checkOut) > 0;
  const key = params.toString();

  const { data: rooms, loading, error, reload } = useFetch(() => {
    const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    return hasDates ? checkAvailability(clean) : getRooms(clean);
  }, [key]);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (hasDates) {
      q.set('checkIn', filters.checkIn);
      q.set('checkOut', filters.checkOut);
    }
    if (filters.guests) q.set('guests', filters.guests);
    const s = q.toString();
    return s ? `?${s}` : '';
  }, [hasDates, filters.checkIn, filters.checkOut, filters.guests]);

  const update = (name, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name === 'checkIn' && value && (!next.get('checkOut') || next.get('checkOut') <= value)) {
      next.set('checkOut', addDaysInput(value, 1));
    }
    setParams(next, { replace: true });
  };

  const todayStr = toInputDate();

  return (
    <div className="container page">
      <header className="page-intro">
        <h1>Rooms & suites</h1>
        <p className="lead">
          {hasDates
            ? `Showing rooms free from ${formatDate(filters.checkIn)} to ${formatDate(filters.checkOut)}.`
            : 'Add your dates to see which rooms are free.'}
        </p>
      </header>

      <div className="filter-bar" role="search">
        <label>
          <span>Arrive</span>
          <input type="date" className="input" min={todayStr} value={filters.checkIn} onChange={(e) => update('checkIn', e.target.value)} />
        </label>
        <label>
          <span>Leave</span>
          <input type="date" className="input" min={filters.checkIn ? addDaysInput(filters.checkIn, 1) : todayStr} value={filters.checkOut} onChange={(e) => update('checkOut', e.target.value)} />
        </label>
        <label>
          <span>Guests</span>
          <select className="input" value={filters.guests} onChange={(e) => update('guests', e.target.value)}>
            <option value="">Any</option>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
          </select>
        </label>
        <label>
          <span>Room type</span>
          <select className="input" value={filters.type} onChange={(e) => update('type', e.target.value)}>
            <option value="">All types</option>
            {Object.entries(ROOM_TYPES).map(([value, t]) => <option key={value} value={value}>{t.label}</option>)}
          </select>
        </label>
        {key && (
          <button className="btn btn-ghost" onClick={() => setParams({}, { replace: true })}>Clear filters</button>
        )}
      </div>

      <ErrorNote message={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : rooms?.length ? (
        <>
          <p className="result-count">{rooms.length} room{rooms.length > 1 ? 's' : ''} found</p>
          <div className="room-grid">
            {rooms.map((room, i) => <Reveal key={room._id} delay={(i % 3) * 90}><RoomCard room={room} query={query} /></Reveal>)}
          </div>
        </>
      ) : (
        !error && (
          <EmptyState
            icon="bed"
            title="No rooms match these filters"
            text="Try different dates, fewer guests or another room type."
            action={<button className="btn btn-outline" onClick={() => setParams({}, { replace: true })}>Show all rooms</button>}
          />
        )
      )}
    </div>
  );
}
