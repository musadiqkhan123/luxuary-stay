import Icon from '../../components/ui/Icon.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function About() {
  const { settings } = useSettings();
  return (
    <div className="container page narrow">
      <header className="page-intro">
        <h1>The hotel</h1>
        <p className="lead">
          {settings.hotelName} is a small sea-front hotel in Clifton. We keep the room count low so the front desk
          can actually know who is staying with us.
        </p>
      </header>

      <section className="about-block">
        <h2>Find us</h2>
        <ul className="contact-list">
          <li><Icon name="pin" /> {settings.address}</li>
          <li><Icon name="phone" /> <a href={`tel:${settings.phone}`}>{settings.phone}</a></li>
          <li><Icon name="mail" /> <a href={`mailto:${settings.email}`}>{settings.email}</a></li>
          <li><Icon name="clock" /> Check-in from {settings.checkInTime}, check-out by {settings.checkOutTime}</li>
        </ul>
      </section>

      <section className="about-block">
        <h2>House policies</h2>
        <dl className="policy-list">
          <div><dt>Cancellation</dt><dd>{settings.policies?.cancellation}</dd></div>
          <div><dt>Children</dt><dd>{settings.policies?.children}</dd></div>
          <div><dt>Pets</dt><dd>{settings.policies?.pets}</dd></div>
          <div><dt>Taxes</dt><dd>Room rates exclude {settings.taxRate}% government tax, shown before you book.</dd></div>
        </dl>
      </section>

      <section className="about-block">
        <h2>Your privacy</h2>
        <p>
          We only keep the details we need to look after your stay. From your profile you can download everything we
          store about you, switch off marketing messages, or close your account at any time.
        </p>
      </section>
    </div>
  );
}
