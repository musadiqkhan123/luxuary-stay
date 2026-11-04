import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import Icon from '../ui/Icon.jsx';
import { NAV_ITEMS, ROLE_LABELS } from '../../utils/constants.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../ui/Avatar.jsx';

export default function Sidebar({ open, onNavigate }) {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Dashboard navigation">
      <div className="sidebar-top">
        <Logo to="/" />
      </div>
      <p className="sidebar-role">{ROLE_LABELS[user.role]} workspace</p>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}>
            <Icon name={item.icon} size={19} />
            <span>{user.role === 'guest' && item.guestLabel ? item.guestLabel : item.label}</span>
          </NavLink>
        ))}
      </nav>
      <NavLink to="/dashboard/profile" className="sidebar-user" onClick={onNavigate}>
        <Avatar user={user} size={34} />
        <span>{user.name}<small>{user.email}</small></span>
      </NavLink>
      {user.role === 'guest' && (
        <NavLink to="/rooms" className="sidebar-cta" onClick={onNavigate}>
          <Icon name="bed" size={18} /> Book another stay
        </NavLink>
      )}
    </aside>
  );
}
