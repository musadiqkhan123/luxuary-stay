export const ROLES = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
  HOUSEKEEPING: 'housekeeping',
  GUEST: 'guest',
});

export const ALL_ROLES = Object.values(ROLES);
export const ROLE_LABELS = { admin: 'Administrator', manager: 'Manager', receptionist: 'Receptionist', housekeeping: 'Housekeeping', guest: 'Guest' };
export const STAFF_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping'];
export const MANAGEMENT = ['admin', 'manager'];
export const FRONT_OFFICE = ['admin', 'manager', 'receptionist'];

export const ROOM_TYPES = ['classic', 'deluxe', 'executive', 'presidential'];
export const ROOM_STATUSES = ['available', 'reserved', 'occupied', 'cleaning', 'maintenance'];

export const BOOKING_STATUSES = ['confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'];
export const ACTIVE_BOOKING_STATUSES = ['confirmed', 'checked-in'];

export const SERVICE_TYPES = ['room-service', 'laundry', 'wake-up-call', 'transport', 'spa', 'housekeeping', 'other'];
export const REQUEST_STATUSES = ['pending', 'in-progress', 'completed', 'cancelled'];

export const TASK_TYPES = ['cleaning', 'deep-cleaning', 'turndown', 'inspection'];
export const TASK_STATUSES = ['pending', 'in-progress', 'completed'];

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const MAINTENANCE_STATUSES = ['open', 'in-progress', 'resolved'];

export const PAYMENT_METHODS = ['cash', 'card', 'bank-transfer', 'online'];
