import { Link } from 'react-router-dom';
import Spinner from '../ui/Spinner.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import Icon from '../ui/Icon.jsx';
import StatCard from '../ui/StatCard.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getDashboard } from '../../services/reportService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ROOM_TYPES } from '../../utils/constants.js';
import { money, formatDate, nightsBetween, toInputDate } from '../../utils/format.js';

export default function GuestOverview() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { data, loading, error, reload } = useFetch(() => getDashboard(), []);

  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const { current, upcoming } = data;
  const nightsLeft = current ? nightsBetween(toInputDate(), current.checkOut.slice(0, 10)) : 0;

  return (
    <div className="stack-lg">
      {current ? (
        <section className="stay-card">
          <div className="stay-card-main">
            <p className="stay-label">You are staying in</p>
            <p className="stay-room">Room {current.room.roomNumber}</p>
            <p>{ROOM_TYPES[current.room.type]?.label}, floor {current.room.floor}</p>
            <p className="stay-dates">
              Until {formatDate(current.checkOut)} at {settings.checkOutTime}
              {nightsLeft > 0 ? ` (${nightsLeft} night${nightsLeft > 1 ? 's' : ''} left)` : ' (checking out today)'}
            </p>
            {current.keyCard && <p className="stay-key"><Icon name="key" size={16} /> Key card {current.keyCard}</p>}
          </div>
          <div className="stay-actions">
            <Link to="/dashboard/services" className="btn btn-light"><Icon name="concierge" size={18} /> Request a service</Link>
            <Link to="/dashboard/maintenance" className="btn btn-ghost-light"><Icon name="wrench" size={18} /> Report a problem</Link>
            <Link to={`/dashboard/bookings/${current._id}`} className="btn btn-ghost-light"><Icon name="receipt" size={18} /> See my bill</Link>
          </div>
        </section>
      ) : (
        <section className="welcome-card">
          <h1>Welcome, {user.name.split(' ')[0]}</h1>
          <p className="lead">{upcoming.length ? 'Your next stay is below.' : 'Plan your next stay with us.'}</p>
          <Link to="/rooms" className="btn btn-primary">Find a room</Link>
        </section>
      )}

      <div className="stats">
        <StatCard label="Upcoming stays" value={upcoming.length} to="/dashboard/bookings" />
        <StatCard label="Completed stays" value={data.stays} />
        <StatCard label="Open requests" value={data.openRequests} to="/dashboard/services" />
        <StatCard label="Balance due" value={money(data.balanceDue, settings.currency)} to="/dashboard/invoices" />
      </div>

      {upcoming.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>Coming up</h2>
            <Link to="/dashboard/bookings" className="text-link">All bookings</Link>
          </div>
          <ul className="upcoming">
            {upcoming.map((b) => (
              <li key={b._id}>
                <Link to={`/dashboard/bookings/${b._id}`}>
                  <span className="upcoming-date">{formatDate(b.checkIn, { year: undefined })}</span>
                  <span>{ROOM_TYPES[b.room?.type]?.label}, room {b.room?.roomNumber}</span>
                  <span className="muted">{b.nights} night{b.nights > 1 ? 's' : ''}</span>
                  <span className="mono">{b.code}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
