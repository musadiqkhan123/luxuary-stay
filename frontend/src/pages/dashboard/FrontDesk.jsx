import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Badge from '../../components/ui/Badge.jsx';
import NewBookingModal from '../../components/bookings/NewBookingModal.jsx';
import CheckOutModal from '../../components/bookings/CheckOutModal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getTodayBoard, checkIn } from '../../services/bookingService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatShortDate, nightsBetween, toInputDate } from '../../utils/format.js';

export default function FrontDesk() {
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => getTodayBoard(), []);
  const [walkIn, setWalkIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(null);
  const [busyId, setBusyId] = useState('');

  const doCheckIn = async (booking) => {
    setBusyId(booking._id);
    try {
      const res = await checkIn(booking._id, {});
      toast.success(res.message);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId('');
    }
  };

  const todayStr = toInputDate();

  return (
    <>
      <PageHeader
        title="Front desk"
        description="Today's arrivals, departures and guests in house."
        actions={
          <>
            <button className="btn btn-ghost" onClick={reload}><Icon name="refresh" size={16} /> Refresh</button>
            <button className="btn btn-primary" onClick={() => setWalkIn(true)}><Icon name="plus" size={18} /> Walk-in booking</button>
          </>
        }
      />
      <ErrorNote message={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : data && (
        <div className="desk-columns">
          <section className="panel desk-col">
            <div className="panel-head"><h2>Arrivals <span className="count">{data.arrivals.length}</span></h2></div>
            {data.arrivals.length ? (
              <ul className="desk-list">
                {data.arrivals.map((b) => {
                  const late = b.checkIn.slice(0, 10) < todayStr;
                  return (
                    <li key={b._id}>
                      <span className="room-chip">{b.room?.roomNumber}</span>
                      <div className="desk-info">
                        <Link to={`/dashboard/bookings/${b._id}`}>{b.guest?.name}</Link>
                        <span className="cell-sub">{b.nights} night{b.nights > 1 ? 's' : ''}, {b.adults + b.children} guest{b.adults + b.children > 1 ? 's' : ''}{late ? `, due ${formatShortDate(b.checkIn)}` : ''}</span>
                      </div>
                      {late && <Badge status="pending" label="Late" />}
                      <button className="btn btn-sm btn-primary" disabled={busyId === b._id} onClick={() => doCheckIn(b)}>Check in</button>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="muted desk-empty">No arrivals waiting.</p>}
          </section>

          <section className="panel desk-col">
            <div className="panel-head"><h2>Departures <span className="count">{data.departures.length}</span></h2></div>
            {data.departures.length ? (
              <ul className="desk-list">
                {data.departures.map((b) => (
                  <li key={b._id}>
                    <span className="room-chip">{b.room?.roomNumber}</span>
                    <div className="desk-info">
                      <Link to={`/dashboard/bookings/${b._id}`}>{b.guest?.name}</Link>
                      <span className="cell-sub">Stayed {b.nights} night{b.nights > 1 ? 's' : ''}</span>
                    </div>
                    <button className="btn btn-sm btn-outline" onClick={() => setCheckingOut(b)}>Check out</button>
                  </li>
                ))}
              </ul>
            ) : <p className="muted desk-empty">No departures due.</p>}
          </section>

          <section className="panel desk-col">
            <div className="panel-head"><h2>In house <span className="count">{data.inHouse.length}</span></h2></div>
            {data.inHouse.length ? (
              <ul className="desk-list">
                {data.inHouse.map((b) => {
                  const left = nightsBetween(todayStr, b.checkOut.slice(0, 10));
                  return (
                    <li key={b._id}>
                      <span className="room-chip">{b.room?.roomNumber}</span>
                      <div className="desk-info">
                        <Link to={`/dashboard/bookings/${b._id}`}>{b.guest?.name}</Link>
                        <span className="cell-sub">{left > 0 ? `Leaves ${formatShortDate(b.checkOut)}` : 'Leaves today'}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="muted desk-empty">No guests checked in.</p>}
          </section>
        </div>
      )}

      <NewBookingModal open={walkIn} onClose={() => setWalkIn(false)} onCreated={(b) => { setWalkIn(false); navigate(`/dashboard/bookings/${b._id}`); }} />
      <CheckOutModal booking={checkingOut} open={Boolean(checkingOut)} onClose={() => setCheckingOut(null)} onDone={(res) => { setCheckingOut(null); reload(); navigate(`/dashboard/invoices/${res.invoice._id}`); }} />
    </>
  );
}
