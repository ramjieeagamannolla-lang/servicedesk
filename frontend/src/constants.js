export const TICKET_CATEGORIES = ['Hardware', 'Software', 'Network', 'Access', 'Security', 'Email', 'Printer', 'VPN', 'Other'];

export const TICKET_PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const TICKET_STATUS = [
  'NEW',
  'TRIAGED',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_FOR_USER',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
];

export const TICKET_TRANSITIONS = {
  NEW: ['TRIAGED', 'ASSIGNED'],
  TRIAGED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['WAITING_FOR_USER', 'RESOLVED'],
  WAITING_FOR_USER: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  REOPENED: ['ASSIGNED', 'IN_PROGRESS'],
  CLOSED: [],
};

export const ASSET_TYPES = ['LAPTOP', 'DESKTOP', 'MONITOR', 'MOBILE', 'PRINTER', 'SOFTWARE', 'NETWORK_DEVICE', 'OTHER'];

export const ASSET_STATUS = ['AVAILABLE', 'ASSIGNED', 'IN_REPAIR', 'RETIRED', 'LOST'];

export const IMPACT = ['LOW', 'MEDIUM', 'HIGH'];
export const URGENCY = ['LOW', 'MEDIUM', 'HIGH'];
