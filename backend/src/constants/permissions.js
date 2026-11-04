// Single source of truth for "who can do what".
// Shown on the admin "Staff & roles" screen and enforced by route middleware.
export const PERMISSIONS = [
  { module: 'Users & roles', admin: 'full', manager: 'none', receptionist: 'none', housekeeping: 'none', guest: 'own profile' },
  { module: 'Guest profiles', admin: 'full', manager: 'full', receptionist: 'full', housekeeping: 'none', guest: 'own profile' },
  { module: 'Rooms & rates', admin: 'full', manager: 'full', receptionist: 'view + status', housekeeping: 'view + status', guest: 'browse' },
  { module: 'Reservations', admin: 'full', manager: 'full', receptionist: 'full', housekeeping: 'none', guest: 'own bookings' },
  { module: 'Check-in / check-out', admin: 'full', manager: 'full', receptionist: 'full', housekeeping: 'none', guest: 'none' },
  { module: 'Billing & invoices', admin: 'full', manager: 'full', receptionist: 'full', housekeeping: 'none', guest: 'own invoices' },
  { module: 'Housekeeping tasks', admin: 'full', manager: 'full', receptionist: 'create', housekeeping: 'own tasks', guest: 'none' },
  { module: 'Maintenance', admin: 'full', manager: 'full', receptionist: 'report + update', housekeeping: 'report', guest: 'report' },
  { module: 'Guest services', admin: 'full', manager: 'full', receptionist: 'full', housekeeping: 'update', guest: 'request' },
  { module: 'Feedback', admin: 'full', manager: 'full', receptionist: 'respond', housekeeping: 'none', guest: 'write' },
  { module: 'Reports & analytics', admin: 'full', manager: 'full', receptionist: 'none', housekeeping: 'none', guest: 'none' },
  { module: 'System settings', admin: 'full', manager: 'none', receptionist: 'none', housekeeping: 'none', guest: 'none' },
];
