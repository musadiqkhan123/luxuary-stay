import { Link } from 'react-router-dom';

export default function Logo({ to = '/', compact = false }) {
  return (
    <Link to={to} className="logo" aria-label="LuxuryStay home">
      <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#6B4F3A" />
        <path d="M20 16v32h24" fill="none" stroke="#F7F3ED" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="42" cy="22" r="5" fill="#B69A7D" />
      </svg>
      {!compact && (
        <span className="logo-text">
          LuxuryStay
          <small>Hospitality</small>
        </span>
      )}
    </Link>
  );
}
