import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import NewBookingModal from '../../components/bookings/NewBookingModal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getBookings } from '../../services/bookingService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { money, formatDate } from '../../utils/format.js';
import { ROOM_TYPES } from '../../utils/constants.js';

const TABS = [
  { value: '', label: 'All' },
  { value: 'confirmed', label: 'Upcoming' },
  { value: 'checked-in', label: 'In house' },
  { value: 'checked-out', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Bookings() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [searchText, setSearchText] = useState(params.get('search') || '');
  const [creating, setCreating] = useState(false);
  const isGuest = user.role === 'guest';

  const status = params.get('status') || '';
  const page = Number(params.get('page')) || 1;
  const search = params.get('search') || '';
  const { data, meta, loading, error, reload } = useFetch(() => getBookings({ status, page, search }), [status, page, search]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  return (
    <>
      <PageHeader
        title={isGuest ? 'My bookings' : 'Reservations'}
        description={isGuest ? 'Upcoming, current and past stays.' : 'Search, filter and open any reservation.'}
        actions={
          isGuest ? (
            <Link to="/rooms" className="btn btn-primary"><Icon name="plus" size={18} /> Book a stay</Link>
          ) : (
            <button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" size={18} /> New reservation</button>
          )
        }
      />

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.value} role="tab" aria-selected={status === t.value} className={`tab ${status === t.value ? 'is-on' : ''}`} onClick={() => setParam('status', t.value)}>
              {t.label}
            </button>
          ))}
        </div>
        {!isGuest && (
          <form className="search-input" onSubmit={(e) => { e.preventDefault(); setParam('search', searchText.trim()); }}>
            <Icon name="search" size={18} />
            <input className="input" placeholder="Booking code, guest name or room" value={searchText} onChange={(e) => setSearchText(e.target.value)} aria-label="Search reservations" />
          </form>
        )}
      </div>

      <ErrorNote message={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : data?.length ? (
        <section className="panel">
          <div className="table-wrap">
            <table className="table table-clickable">
              <thead>
                <tr>
                  <th>Booking</th>
                  {!isGuest && <th>Guest</th>}
                  <th>Room</th>
                  <th>Arrive</th>
                  <th>Leave</th>
                  <th className="num">Room total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((b) => (
                  <tr key={b._id} onClick={() => navigate(`/dashboard/bookings/${b._id}`)}>
                    <td><Link to={`/dashboard/bookings/${b._id}`} className="mono-link" onClick={(e) => e.stopPropagation()}>{b.code}</Link></td>
                    {!isGuest && <td>{b.guest?.name}<span className="cell-sub">{b.source === 'online' ? 'Online' : 'Front desk'}</span></td>}
                    <td>{b.room?.roomNumber}<span className="cell-sub">{ROOM_TYPES[b.room?.type]?.short}</span></td>
                    <td>{formatDate(b.checkIn)}</td>
                    <td>{formatDate(b.checkOut)}<span className="cell-sub">{b.nights} night{b.nights > 1 ? 's' : ''}</span></td>
                    <td className="num">{money(b.roomTotal, settings.currency)}</td>
                    <td><Badge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPage={(p) => setParam('page', String(p))} />
        </section>
      ) : (
        !error && (
          <EmptyState
            icon="calendar"
            title={search || status ? 'No reservations match' : 'No reservations yet'}
            text={isGuest ? 'When you book a room it will show up here.' : 'Try a different filter or create a reservation.'}
            action={isGuest && <Link to="/rooms" className="btn btn-primary">Find a room</Link>}
          />
        )
      )}

      {!isGuest && (
        <NewBookingModal open={creating} onClose={() => setCreating(false)} onCreated={(b) => { setCreating(false); navigate(`/dashboard/bookings/${b._id}`); }} />
      )}
    </>
  );
}
