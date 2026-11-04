import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import StaffOverview from '../../components/dashboard/StaffOverview.jsx';
import HousekeepingOverview from '../../components/dashboard/HousekeepingOverview.jsx';
import GuestOverview from '../../components/dashboard/GuestOverview.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { formatDate, toInputDate } from '../../utils/format.js';

export default function Overview() {
  const { user } = useAuth();
  const today = formatDate(toInputDate(), { weekday: 'long' });

  if (user.role === 'guest') return <GuestOverview />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const actions = user.role === 'housekeeping'
    ? [['/dashboard/housekeeping', 'sparkle', 'Open task list'], ['/dashboard/rooms', 'door', 'Room board'], ['/dashboard/maintenance', 'wrench', 'Report a problem']]
    : [['/dashboard/front-desk', 'bell', 'Front desk'], ['/dashboard/bookings', 'calendar', 'Reservations'], ['/dashboard/rooms', 'door', 'Room board']];

  return (
    <>
      <section className="welcome-banner">
        <div>
          <p className="welcome-date">{today}</p>
          <h1>{greeting}, {user.name.split(' ')[0]}</h1>
          <p className="welcome-sub">{user.role === 'housekeeping' ? 'Here is what needs attention on your shift.' : 'Here is how the hotel looks right now.'}</p>
        </div>
        <div className="welcome-actions">
          {actions.map(([to, icon, label], i) => (
            <Link key={to} to={to} className={`btn ${i === 0 ? 'btn-accent' : 'btn-ghost-light'}`}><Icon name={icon} size={16} /> {label}</Link>
          ))}
        </div>
      </section>
      {user.role === 'housekeeping' ? <HousekeepingOverview /> : <StaffOverview />}
    </>
  );
}
