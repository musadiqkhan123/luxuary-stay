import { Outlet, useLocation } from 'react-router-dom';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';

export default function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <div className="public-shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" key={pathname} className="page-fade">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
