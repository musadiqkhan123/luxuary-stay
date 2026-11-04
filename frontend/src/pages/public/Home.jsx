import { Link } from 'react-router-dom';
import KeyCardSearch from '../../components/rooms/KeyCardSearch.jsx';
import RoomImage from '../../components/ui/RoomImage.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Stars from '../../components/ui/Stars.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getRooms } from '../../services/roomService.js';
import { getPublicFeedback } from '../../services/feedbackService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ROOM_TYPES } from '../../utils/constants.js';
import { money, imageUrl } from '../../utils/format.js';

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=70';

const TYPE_COPY = {
  classic: 'Queen or twin beds, a rain shower and a real desk. Built for short city stays.',
  deluxe: 'A king bed, a bathtub and a window seat facing the sea.',
  executive: 'A separate living room, lounge access and evening refreshments.',
  presidential: 'The top floor: private terrace, dining room for six and a butler.',
};

const SERVICES = [
  { icon: 'utensils', title: 'Room service', text: 'Breakfast to late-night snacks, delivered to your door.' },
  { icon: 'shirt', title: 'Laundry & pressing', text: 'Same-day if we collect before 10 AM.' },
  { icon: 'car', title: 'Airport transfers', text: 'Jinnah International is 35 minutes away. We will meet you.' },
  { icon: 'leaf', title: 'Spa treatments', text: 'Massages and facials in-room or at the spa on level 1.' },
  { icon: 'sun', title: 'Wake-up calls', text: 'Set one from your phone, change it any time.' },
  { icon: 'wrench', title: 'Something not right?', text: 'Report it from your dashboard and track the fix.' },
];

const STRIP = [
  ['wifi', 'Fast Wi-Fi in every room'], ['sun', 'Sunrise over the sea'], ['utensils', '24-hour room service'],
  ['car', 'Airport pick-up'], ['leaf', 'In-room spa'], ['key', 'Two-minute check-in'], ['bed', 'Pillow menu'],
];

export default function Home() {
  const { settings } = useSettings();
  const { data: rooms } = useFetch(() => getRooms(), []);
  const { data: reviews } = useFetch(() => getPublicFeedback(), []);

  const types = Object.keys(ROOM_TYPES)
    .map((type) => {
      const list = (rooms || []).filter((r) => r.type === type);
      if (!list.length) return null;
      return { type, image: imageUrl(list[0].images?.[0]), from: Math.min(...list.map((r) => r.pricePerNight)) };
    })
    .filter(Boolean);
  const lowest = types.length ? Math.min(...types.map((t) => t.from)) : null;
  const heroSrc = imageUrl(settings.heroImage) || FALLBACK_HERO;

  return (
    <>
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="hero-place"><Icon name="pin" size={16} /> Clifton, Karachi</p>
            <h1>
              <span className="line">Wake up to</span>
              <span className="line">the Arabian Sea.</span>
            </h1>
            <p className="hero-lead">
              Sea-view rooms and suites, a front desk that remembers your name, and the beach a five-minute walk away.
            </p>
            <KeyCardSearch />
          </div>
          <figure className="hero-media">
            <div className="hero-frame">
              <RoomImage src={heroSrc} alt={`${settings.hotelName}`} />
            </div>
            {lowest && (
              <figcaption className="float-tag float-tag-a">
                <span>Tonight from</span>
                <strong>{money(lowest, settings.currency)}</strong>
              </figcaption>
            )}
            <div className="float-tag float-tag-b" aria-hidden="true">
              <Icon name="clock" size={16} /> Check-in from {settings.checkInTime}
            </div>
          </figure>
        </div>
      </section>

      <div className="strip" aria-hidden="true">
        <div className="strip-track">
          {[...STRIP, ...STRIP].map(([icon, label], i) => (
            <span key={i}><Icon name={icon} size={18} /> {label}</span>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <h2>Rooms & suites</h2>
              <p className="muted">Four ways to stay, every one with a view.</p>
            </div>
            <Link to="/rooms" className="text-link">See every room <Icon name="chevron" size={16} /></Link>
          </Reveal>
          <div className="type-grid">
            {types.map((t, i) => (
              <Reveal key={t.type} delay={i * 100}>
                <Link to={`/rooms?type=${t.type}`} className="type-card">
                  <div className="type-card-media">
                    <RoomImage src={t.image} alt={ROOM_TYPES[t.type].label} />
                    <span className="type-card-price">From {money(t.from, settings.currency)}</span>
                  </div>
                  <div className="type-card-body">
                    <h3>{ROOM_TYPES[t.type].label}</h3>
                    <p>{TYPE_COPY[t.type]}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
            {!types.length && <p className="muted">Rooms will appear here once the hotel adds them.</p>}
          </div>
        </div>
      </section>

      <section className="section section-night">
        <div className="container services-layout">
          <Reveal>
            <h2>During your stay</h2>
            <p className="lead">Once you are checked in, everything below is one tap away in your guest dashboard.</p>
            <Link to="/register" className="btn btn-accent">Create a guest account</Link>
          </Reveal>
          <ul className="service-list">
            {SERVICES.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 70}>
                <span className="service-icon"><Icon name={s.icon} size={20} /></span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {reviews?.length > 0 && (
        <section className="section">
          <div className="container">
            <Reveal className="section-head"><h2>What guests tell us</h2></Reveal>
            <div className="review-grid">
              {reviews.slice(0, 3).map((r, i) => (
                <Reveal as="blockquote" key={r._id} className="review" delay={i * 120}>
                  <Stars value={r.rating} />
                  {r.title && <strong className="review-title">{r.title}</strong>}
                  <p>{r.comment}</p>
                  <footer>{r.guestName}{r.guestFrom ? `, ${r.guestFrom}` : ''}</footer>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section-accent">
        <Reveal className="container info-band">
          <div>
            <h2>Plan your arrival</h2>
            <p>Check-in from {settings.checkInTime}. Check-out by {settings.checkOutTime}. Early arrival? Leave your bags with us.</p>
          </div>
          <div className="info-band-actions">
            <Link to="/rooms" className="btn btn-dark">Find a room</Link>
            <Link to="/about" className="btn btn-outline-dark">Policies & contact</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
