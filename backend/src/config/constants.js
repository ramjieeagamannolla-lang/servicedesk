// Central place for every enum used across the app so the backend, seed data,
// and validation all stay in sync.

const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  IT_MANAGER: 'IT_MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  EMPLOYEE: 'EMPLOYEE',
  ASSET_MANAGER: 'ASSET_MANAGER',
};

const TICKET_CATEGORIES = [
  'Hardware',
  'Software',
  'Network',
  'Access',
  'Security',
  'Email',
  'Printer',
  'VPN',
  'Other',
];

const TICKET_PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const TICKET_STATUS = [
  'NEW',
  'TRIAGED',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_FOR_USER',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
];

// Allowed forward transitions. Enforced server-side in ticketController.
const TICKET_TRANSITIONS = {
  NEW: ['TRIAGED', 'ASSIGNED'],
  TRIAGED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['WAITING_FOR_USER', 'RESOLVED'],
  WAITING_FOR_USER: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  REOPENED: ['ASSIGNED', 'IN_PROGRESS'],
  CLOSED: [],
};

const SLA_STATUS = ['SAFE', 'AT_RISK', 'BREACHED'];

const ASSET_TYPES = [
  'LAPTOP',
  'DESKTOP',
  'MONITOR',
  'MOBILE',
  'PRINTER',
  'SOFTWARE',
  'NETWORK_DEVICE',
  'OTHER',
];

const ASSET_STATUS = ['AVAILABLE', 'ASSIGNED', 'IN_REPAIR', 'RETIRED', 'LOST'];

const IMPACT = ['LOW', 'MEDIUM', 'HIGH'];
const URGENCY = ['LOW', 'MEDIUM', 'HIGH'];

// Default SLA targets in minutes, keyed by priority. Seeded into the SLA
// collection but also used as a hard fallback if the SLA config is missing.
const DEFAULT_SLA_MINUTES = {
  LOW: { response: 8 * 60, resolution: 48 * 60 },
  MEDIUM: { response: 4 * 60, resolution: 24 * 60 },
  HIGH: { response: 60, resolution: 8 * 60 },
  CRITICAL: { response: 15, resolution: 4 * 60 },
};

module.exports = {
  ROLES,
  TICKET_CATEGORIES,
  TICKET_PRIORITY,
  TICKET_STATUS,
  TICKET_TRANSITIONS,
  SLA_STATUS,
  ASSET_TYPES,
  ASSET_STATUS,
  IMPACT,
  URGENCY,
  DEFAULT_SLA_MINUTES,
};
