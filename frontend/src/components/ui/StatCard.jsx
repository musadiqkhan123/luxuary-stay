import { Link } from 'react-router-dom';
import CountUp from './CountUp.jsx';

export default function StatCard({ label, value, hint, to, tone }) {
  const body = (
    <>
      <span className="stat-label">{label}</span>
      <strong className="stat-value"><CountUp value={value} /></strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </>
  );
  const cls = `stat ${tone ? `stat-${tone}` : ''}`;
  return to ? (
    <Link to={to} className={`${cls} stat-link`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
