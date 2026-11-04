import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext.jsx';
import Icon from '../ui/Icon.jsx';
import Logo from './Logo.jsx';

export default function SiteFooter() {
  const { settings } = useSettings();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="footer-note">Sea-facing rooms and suites in Clifton, Karachi.</p>
        </div>
        <div>
          <h3>Visit</h3>
          <p><Icon name="pin" size={16} /> {settings.address}</p>
          <p><Icon name="clock" size={16} /> Check-in {settings.checkInTime}, check-out {settings.checkOutTime}</p>
        </div>
        <div>
          <h3>Contact</h3>
          <p><Icon name="phone" size={16} /> <a href={`tel:${settings.phone}`}>{settings.phone}</a></p>
          <p><Icon name="mail" size={16} /> <a href={`mailto:${settings.email}`}>{settings.email}</a></p>
        </div>
        <div>
          <h3>Explore</h3>
          <p><Link to="/rooms">Rooms & suites</Link></p>
          <p><Link to="/about">Policies</Link></p>
          <p><Link to="/login">Staff login</Link></p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {settings.hotelName}</span>
        <span>Your data is handled under our privacy policy.</span>
      </div>
    </footer>
  );
}
