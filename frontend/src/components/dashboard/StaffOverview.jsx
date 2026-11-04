import { Link } from 'react-router-dom';
import StatCard from '../ui/StatCard.jsx';
import Badge from '../ui/Badge.jsx';
import Spinner from '../ui/Spinner.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getDashboard } from '../../services/reportService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { money, formatShortDate } from '../../utils/format.js';
import { ROOM_STATUS, MANAGEMENT } from '../../utils/constants.js';

export default function StaffOverview() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { data, loading, error, reload } = useFetch(() => getDashboard(), []);

  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const isManagement = MANAGEMENT.includes(user.role);
  const statusEntries = Object.entries(data.roomStatus);

  return (
    <div className="stack-lg">
      <div className="stats">
        <StatCard label="Occupancy tonight" value={`${data.occupancy}%`} hint={`${data.roomStatus.occupied} of ${data.totalRooms} rooms`} />
        <StatCard label="Arrivals due" value={data.arrivals} hint="Confirmed, not checked in" to="/dashboard/front-desk" />
        <StatCard label="Departures due" value={data.departures} hint="Checking out today" to="/dashboard/front-desk" />
        <StatCard label="Guests in house" value={data.inHouse} to="/dashboard/bookings?status=checked-in" />
        {isManagement && (
          <StatCard label="Billed this month" value={money(data.revenueThisMonth, settings.currency)} hint={`${money(data.collectedThisMonth, settings.currency)} collected`} />
        )}
        <StatCard label="Guest rating" value={data.averageRating ? `${data.averageRating} / 5` : '—'} to="/dashboard/feedback" />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Rooms right now</h2>
            <Link to="/dashboard/rooms" className="text-link">Room board</Link>
          </div>
          <div className="status-bar" role="img" aria-label="Room status breakdown">
            {statusEntries.map(([status, count]) =>
              count ? <span key={status} className={`status-seg seg-${status}`} style={{ flex: count }} title={`${ROOM_STATUS[status]}: ${count}`} /> : null,
            )}
          </div>
          <ul className="legend">
            {statusEntries.map(([status, count]) => (
              <li key={status}><span className={`dot seg-${status}`} /> {ROOM_STATUS[status]} <strong>{count}</strong></li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Waiting on the team</h2></div>
          <ul className="queue">
            <li><Link to="/dashboard/services"><span>Guest requests open</span><strong>{data.pendingRequests}</strong></Link></li>
            <li><Link to="/dashboard/housekeeping"><span>Housekeeping tasks open</span><strong>{data.pendingTasks}</strong></Link></li>
            <li><Link to="/dashboard/maintenance"><span>Maintenance issues open</span><strong>{data.openMaintenance}</strong></Link></li>
          </ul>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Latest reservations</h2>
          <Link to="/dashboard/bookings" className="text-link">All reservations</Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Booking</th><th>Guest</th><th>Room</th><th>Stay</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.recentBookings.map((b) => (
                <tr key={b._id}>
                  <td><Link to={`/dashboard/bookings/${b._id}`} className="mono-link">{b.code}</Link></td>
                  <td>{b.guest?.name}</td>
                  <td>{b.room?.roomNumber}</td>
                  <td>{formatShortDate(b.checkIn)} to {formatShortDate(b.checkOut)}</td>
                  <td><Badge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
