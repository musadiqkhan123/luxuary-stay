import { Link } from 'react-router-dom';
import Logo from '../layout/Logo.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import Icon from '../ui/Icon.jsx';
import RoomImage from '../ui/RoomImage.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { imageUrl } from '../../utils/format.js';

const FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=70';

// Split screen used by login, register, forgot and reset password
export default function AuthLayout({ title, subtitle, children, footer }) {
  const { settings } = useSettings();
  return (
    <div className="auth-shell">
      <aside className="auth-visual" aria-hidden="true">
        <RoomImage src={imageUrl(settings.heroImage) || FALLBACK} alt="" />
        <div className="auth-visual-shade" />
        <div className="auth-visual-content">
          <Logo />
          <blockquote>
            “Check-in took two minutes and the room was ready early. The sea view at sunrise is worth the trip alone.”
            <footer>Guest review</footer>
          </blockquote>
          <ul>
            <li><Icon name="key" size={16} /> Manage bookings and invoices</li>
            <li><Icon name="concierge" size={16} /> Request services during your stay</li>
            <li><Icon name="shield" size={16} /> Secure, role-based staff access</li>
          </ul>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-top">
          <Link to="/" className="text-link"><Icon name="back" size={16} /> Back to website</Link>
          <ThemeToggle />
        </div>
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo"><Logo /></div>
          <h1>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
        <p className="auth-legal">© {new Date().getFullYear()} {settings.hotelName}. Protected access — activity is logged.</p>
      </main>
    </div>
  );
}
