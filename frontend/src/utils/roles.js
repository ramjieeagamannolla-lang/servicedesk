export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  IT_MANAGER: 'IT_MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  EMPLOYEE: 'EMPLOYEE',
  ASSET_MANAGER: 'ASSET_MANAGER',
};

export const ROLE_LABELS = {
  SYSTEM_ADMIN: 'System Admin',
  IT_MANAGER: 'IT Manager',
  TECHNICIAN: 'Technician',
  EMPLOYEE: 'Employee',
  ASSET_MANAGER: 'Asset Manager',
};

export const STAFF_ROLES = [ROLES.TECHNICIAN, ROLES.IT_MANAGER, ROLES.SYSTEM_ADMIN];

export function hasAnyRole(user, roles) {
  return Boolean(user) && roles.includes(user.role);
}
