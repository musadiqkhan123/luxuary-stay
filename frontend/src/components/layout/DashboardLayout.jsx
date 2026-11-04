import { Suspense, useState } from 'react';
import Spinner from '../ui/Spinner.jsx';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function DashboardLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <div className="dash-shell">
      <a href="#dash-main" className="skip-link">Skip to content</a>
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      {navOpen && <div className="sidebar-scrim" onClick={() => setNavOpen(false)} />}
      <div className="dash-main">
        <Topbar onMenu={() => setNavOpen(true)} />
        <main id="dash-main" key={pathname} className="dash-content page-enter">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
