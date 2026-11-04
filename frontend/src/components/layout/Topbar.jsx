import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext.jsx';
import Icon from '../ui/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getNotifications } from '../../services/notificationService.js';
import Avatar from '../ui/Avatar.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { ROLE_LABELS, NAV_ITEMS } from '../../utils/constants.js';

const EXTRA_TITLES = { '/dashboard/notifications': 'Notifications', '/dashboard/profile': 'My profile' };

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);
  const lastSeen = useRef(null);

  // Page title for the breadcrumb, e.g. "Reservations / Booking"
  const section = [...NAV_ITEMS].sort((a, b) => b.to.length - a.to.length).find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
  const sectionLabel = EXTRA_TITLES[pathname] || (section ? (user.role === 'guest' && section.guestLabel) || section.label : 'Overview');
  const isDetail = section && pathname !== section.to && !EXTRA_TITLES[pathname];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Poll the unread count every 45 seconds
  useEffect(() => {
    let alive = true;
    const load = () =>
      getNotifications()
        .then((res) => {
          if (!alive) return;
          const count = res.meta?.unread || 0;
          const newest = res.data?.find((n) => !n.isRead);
          // Pop a toast when something new arrives after the page was opened
          if (lastSeen.current !== null && newest && newest._id !== lastSeen.current && count > 0) {
            toast.info(`${newest.title}${newest.message ? ` — ${newest.message}` : ''}`, { onClick: () => newest.link && navigate(newest.link) });
          }
          lastSeen.current = newest?._id || '';
          setUnread(count);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, 45000);
    window.addEventListener('notifications:changed', load);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener('notifications:changed', load);
    };
  }, []);

  useEffect(() => {
    const onClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <button className="icon-btn topbar-menu" onClick={onMenu} aria-label="Open navigation">
        <Icon name="menu" />
      </button>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        {pathname !== '/dashboard' && (
          <>
            <Icon name="chevron" size={14} />
            {isDetail ? <Link to={section.to}>{sectionLabel}</Link> : <span aria-current="page">{sectionLabel}</span>}
          </>
        )}
        {isDetail && (<><Icon name="chevron" size={14} /><span aria-current="page">Details</span></>)}
      </nav>
      <div className="topbar-actions">
        <ThemeToggle />
        <Link to="/dashboard/notifications" className="icon-btn bell-btn" aria-label={`Notifications, ${unread} unread`}>
          <Icon name="bell" />
          {unread > 0 && <span className="bell-count">{unread > 9 ? '9+' : unread}</span>}
        </Link>
        <div className="user-menu" ref={menuRef}>
          <button className="user-chip" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen}>
            <Avatar user={user} size={36} />
            <span className="user-chip-text">
              {user.name}
              <small>{ROLE_LABELS[user.role]}</small>
            </span>
          </button>
          {menuOpen && (
            <div className="user-dropdown" role="menu">
              <Link to="/dashboard/profile" role="menuitem" onClick={() => setMenuOpen(false)}>
                <Icon name="user" size={16} /> My profile
              </Link>
              <Link to="/" role="menuitem" onClick={() => setMenuOpen(false)}>
                <Icon name="door" size={16} /> Hotel website
              </Link>
              <button role="menuitem" onClick={handleLogout}>
                <Icon name="logout" size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
