import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import Icon from '../ui/Icon.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SiteHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Logo />
        <div className="site-header-tools">
          <ThemeToggle />
          <button className="icon-btn site-menu-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Menu">
          <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
        <nav className={`site-nav ${open ? 'is-open' : ''}`} aria-label="Main">
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/rooms" onClick={close}>Rooms & suites</NavLink>
          <NavLink to="/about" onClick={close}>Hotel & contact</NavLink>
          {user ? (
            <Link to="/dashboard" className="btn btn-accent btn-sm" onClick={close}>
              My dashboard
            </Link>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Log in</NavLink>
              <Link to="/rooms" className="btn btn-accent btn-sm" onClick={close}>
                Book a stay
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
