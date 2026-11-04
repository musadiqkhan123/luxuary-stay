import { Link } from 'react-router-dom';
import StatCard from '../ui/StatCard.jsx';
import Badge from '../ui/Badge.jsx';
import Spinner from '../ui/Spinner.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getDashboard } from '../../services/reportService.js';
import { TASK_TYPES } from '../../utils/constants.js';

export default function HousekeepingOverview() {
  const { data, loading, error, reload } = useFetch(() => getDashboard(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  return (
    <div className="stack-lg">
      <div className="stats">
        <StatCard label="Open tasks for you" value={data.tasks.length} to="/dashboard/housekeeping" />
        <StatCard label="Rooms waiting to be cleaned" value={data.cleaning} to="/dashboard/rooms" />
        <StatCard label="Finished today" value={data.doneToday} />
        <StatCard label="Open maintenance issues" value={data.openIssues} to="/dashboard/maintenance" />
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>Next up</h2>
          <Link to="/dashboard/housekeeping" className="text-link">All tasks</Link>
        </div>
        {data.tasks.length ? (
          <ul className="task-mini">
            {data.tasks.map((t) => (
              <li key={t._id}>
                <span className="room-chip">{t.room?.roomNumber}</span>
                <span>{TASK_TYPES[t.type]}{t.notes ? ` — ${t.notes}` : ''}</span>
                <Badge status={t.priority} />
                <Badge status={t.status} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="check" title="Nothing waiting" text="New tasks appear here as soon as guests check out." />
        )}
      </section>
    </div>
  );
}
