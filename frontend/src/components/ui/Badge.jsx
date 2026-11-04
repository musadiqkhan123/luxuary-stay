import { STATUS_TONE } from '../../utils/constants.js';
import { titleCase } from '../../utils/format.js';

export default function Badge({ status, label, tone }) {
  const color = tone || STATUS_TONE[status] || 'grey';
  return <span className={`badge tone-${color}`}>{label || titleCase(status || '')}</span>;
}
