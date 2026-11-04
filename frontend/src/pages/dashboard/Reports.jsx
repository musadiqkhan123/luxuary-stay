import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Icon from '../../components/ui/Icon.jsx';
import BarChart, { HBarChart } from '../../components/ui/BarChart.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getAnalytics } from '../../services/reportService.js';
import { updateSettings, applyRoomRates } from '../../services/settingService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ROOM_TYPES } from '../../utils/constants.js';
import { money, downloadFile } from '../../utils/format.js';

const RANGES = [7, 30, 90];
const shortDay = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export default function Reports() {
  const { user } = useAuth();
  const { settings, refresh } = useSettings();
  const toast = useToast();
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useFetch(() => getAnalytics(days), [days]);
  const cur = settings.currency;

  const exportCsv = () => {
    const rows = [['Date', 'Rooms occupied', 'Occupancy %', `Revenue (${cur})`]];
    data.occupancySeries.forEach((d, i) => rows.push([d.date, d.occupied, d.rate, data.revenueSeries[i]?.revenue || 0]));
    downloadFile(`luxurystay-report-${data.range.from}-to-${data.range.to}.csv`, rows.map((r) => r.join(',')).join('\n'), 'text/csv');
  };

  const applySuggestion = async (p) => {
    if (!window.confirm(`Set the standard ${ROOM_TYPES[p.type].label} rate to ${money(p.suggestedRate, cur)} and apply it to all ${p.rooms} room(s)? Existing bookings keep their rate.`)) return;
    try {
      await updateSettings({ roomRates: { [p.type]: p.suggestedRate } });
      const res = await applyRoomRates();
      toast.success(res.message);
      refresh();
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const labelEvery = days > 30 ? 14 : days > 7 ? 5 : 1;

  return (
    <>
      <PageHeader
        title="Reports"
        description="Occupancy, revenue, guest satisfaction and a 30-day demand forecast."
        actions={
          <>
            <div className="tabs" role="tablist" aria-label="Date range">
              {RANGES.map((r) => (
                <button key={r} role="tab" aria-selected={days === r} className={`tab ${days === r ? 'is-on' : ''}`} onClick={() => setDays(r)}>Last {r} days</button>
              ))}
            </div>
            <button className="btn btn-outline" onClick={exportCsv} disabled={!data}><Icon name="download" size={16} /> Export CSV</button>
          </>
        }
      />
      <ErrorNote message={error} onRetry={reload} />
      {loading || !data ? <Spinner /> : (
        <div className="stack-lg">
          <div className="stats">
            <StatCard label="Average occupancy" value={`${data.totals.averageOccupancy}%`} hint={`${data.totals.roomNightsSold} room-nights sold`} />
            <StatCard label="Revenue billed" value={money(data.totals.revenue, cur)} />
            <StatCard label="Average daily rate" value={money(data.totals.adr, cur)} hint="Revenue per room-night sold" />
            <StatCard label="RevPAR" value={money(data.totals.revpar, cur)} hint="Revenue per available room" />
            <StatCard label="Guest rating" value={data.totals.averageRating ? `${data.totals.averageRating} / 5` : '—'} hint={`${data.totals.reviews} reviews`} />
          </div>

          <div className="grid-2">
            <section className="panel">
              <div className="panel-head"><h2>Occupancy by night</h2></div>
              <BarChart data={data.occupancySeries.map((d) => ({ label: d.date, short: shortDay(d.date), value: d.rate }))} max={100} suffix="%" labelEvery={labelEvery} />
            </section>
            <section className="panel">
              <div className="panel-head"><h2>Revenue billed by day</h2></div>
              <BarChart data={data.revenueSeries.map((d) => ({ label: d.date, short: shortDay(d.date), value: d.revenue }))} format={(v) => money(v, cur)} labelEvery={labelEvery} />
            </section>
          </div>

          <div className="grid-2">
            <section className="panel">
              <div className="panel-head"><h2>Revenue by room type</h2></div>
              <HBarChart data={Object.entries(data.revenueByType).map(([t, v]) => ({ label: ROOM_TYPES[t].label, value: v }))} format={(v) => money(v, cur)} />
            </section>
            <section className="panel">
              <div className="panel-head"><h2>Where bookings came from</h2></div>
              <HBarChart data={[{ label: 'Online', value: data.bySource.online || 0 }, { label: 'Front desk', value: data.bySource['front-desk'] || 0 }]} />
              <div className="panel-head panel-head-sub"><h2>Ratings</h2></div>
              <HBarChart data={[...data.ratingDistribution].reverse().map((r) => ({ label: `${r.star} star`, value: r.count }))} />
            </section>
          </div>

          <section className="panel">
            <div className="panel-head">
              <h2>Next 30 nights: rooms already booked</h2>
              <span className="muted">Average {data.forecastAverage}% on the books</span>
            </div>
            <BarChart data={data.forecastSeries.map((d) => ({ label: d.date, short: shortDay(d.date), value: d.rate }))} max={100} suffix="%" labelEvery={5} />
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Pricing suggestions</h2></div>
            <p className="muted">Based on how full each room type is over the next 30 nights. Above 55% suggests a rise, below 25% suggests a lower rate.</p>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Room type</th><th className="num">Booked ahead</th><th className="num">Current rate</th><th className="num">Suggested</th><th>Advice</th>{user.role === 'admin' && <th />}</tr></thead>
                <tbody>
                  {data.pricing.map((p) => (
                    <tr key={p.type}>
                      <td>{ROOM_TYPES[p.type].label}<span className="cell-sub">{p.rooms} room{p.rooms > 1 ? 's' : ''}</span></td>
                      <td className="num">{p.forecastOccupancy}%</td>
                      <td className="num">{money(p.currentRate, cur)}</td>
                      <td className="num">{money(p.suggestedRate, cur)}</td>
                      <td><Badge tone={p.action === 'raise' ? 'green' : p.action === 'lower' ? 'amber' : 'grey'} label={p.action === 'keep' ? 'Keep rate' : `${p.action === 'raise' ? 'Raise' : 'Lower'} ${Math.abs(p.change)}%`} /></td>
                      {user.role === 'admin' && (
                        <td className="num">{p.action !== 'keep' && <button className="btn btn-sm btn-outline" onClick={() => applySuggestion(p)}>Apply</button>}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
