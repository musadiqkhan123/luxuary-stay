export const ROLE_LABELS = {
  admin: 'Administrator',
  manager: 'Manager',
  receptionist: 'Receptionist',
  housekeeping: 'Housekeeping',
  guest: 'Guest',
};

export const STAFF_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping'];
export const FRONT_OFFICE = ['admin', 'manager', 'receptionist'];
export const MANAGEMENT = ['admin', 'manager'];

export const ROOM_TYPES = {
  classic: { label: 'Classic Room', short: 'Classic' },
  deluxe: { label: 'Deluxe Room', short: 'Deluxe' },
  executive: { label: 'Executive Suite', short: 'Executive' },
  presidential: { label: 'Presidential Suite', short: 'Presidential' },
};

export const ROOM_STATUS = {
  available: 'Available',
  reserved: 'Reserved',
  occupied: 'Occupied',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
};

export const SERVICE_TYPES = {
  'room-service': 'Room service',
  laundry: 'Laundry',
  'wake-up-call': 'Wake-up call',
  transport: 'Transport',
  spa: 'Spa',
  housekeeping: 'Extra housekeeping',
  other: 'Something else',
};

export const PAYMENT_METHODS = { cash: 'Cash', card: 'Card', 'bank-transfer': 'Bank transfer', online: 'Online' };
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const TASK_TYPES = { cleaning: 'Cleaning', 'deep-cleaning': 'Deep cleaning', turndown: 'Turndown', inspection: 'Inspection' };

// Colour tone for every status the app shows
export const STATUS_TONE = {
  available: 'green', reserved: 'blue', occupied: 'teal', cleaning: 'amber', maintenance: 'red',
  confirmed: 'blue', 'checked-in': 'teal', 'checked-out': 'grey', cancelled: 'red', 'no-show': 'red',
  pending: 'amber', 'in-progress': 'blue', completed: 'green',
  open: 'amber', resolved: 'green',
  unpaid: 'red', 'partially-paid': 'amber', paid: 'green',
  low: 'grey', medium: 'blue', high: 'amber', urgent: 'red',
  active: 'green', inactive: 'grey',
};

export const AMENITY_OPTIONS = [
  'Wi-Fi', 'Smart TV', 'Rain shower', 'Bathtub', 'Mini bar', 'Work desk', 'Tea & coffee', 'Sea view',
  'Lounge access', 'Separate living area', 'Nespresso machine', 'Private terrace', 'Dining room', 'Butler service', 'Jacuzzi',
];

// Sidebar navigation — each item lists the roles that can see it
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: 'grid', roles: ['admin', 'manager', 'receptionist', 'housekeeping', 'guest'], end: true },
  { to: '/dashboard/front-desk', label: 'Front desk', icon: 'bell', roles: FRONT_OFFICE },
  { to: '/dashboard/rooms', label: 'Room board', icon: 'door', roles: STAFF_ROLES },
  { to: '/dashboard/bookings', label: 'Reservations', guestLabel: 'My bookings', icon: 'calendar', roles: [...FRONT_OFFICE, 'guest'] },
  { to: '/dashboard/guests', label: 'Guests', icon: 'users', roles: FRONT_OFFICE },
  { to: '/dashboard/invoices', label: 'Invoices', guestLabel: 'My invoices', icon: 'receipt', roles: [...FRONT_OFFICE, 'guest'] },
  { to: '/dashboard/services', label: 'Guest services', guestLabel: 'Requests', icon: 'concierge', roles: ['admin', 'manager', 'receptionist', 'housekeeping', 'guest'] },
  { to: '/dashboard/housekeeping', label: 'Housekeeping', icon: 'sparkle', roles: STAFF_ROLES },
  { to: '/dashboard/maintenance', label: 'Maintenance', guestLabel: 'Report a problem', icon: 'wrench', roles: ['admin', 'manager', 'receptionist', 'housekeeping', 'guest'] },
  { to: '/dashboard/feedback', label: 'Feedback', icon: 'star', roles: [...FRONT_OFFICE, 'guest'] },
  { to: '/dashboard/reports', label: 'Reports', icon: 'chart', roles: MANAGEMENT },
  { to: '/dashboard/users', label: 'Staff & roles', icon: 'shield', roles: ['admin'] },
  { to: '/dashboard/settings', label: 'Settings', icon: 'settings', roles: ['admin'] },
];
