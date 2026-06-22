import type { User, UserRole } from '@/types';

export function isStaffRole(role?: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

/** Staff access to the admin area (admin or superadmin). */
export function isAdminRole(role?: UserRole | null): boolean {
  return isStaffRole(role);
}

export function isSuperAdminRole(role?: UserRole | null): boolean {
  return role === 'SUPERADMIN';
}

export function isCoachRole(role?: UserRole | null): boolean {
  return role === 'COACH';
}

export function canResetUserPassword(
  actor: User | null | undefined,
  target: User,
): boolean {
  if (!actor) return false;
  if (target.role === 'COACH') return isStaffRole(actor.role);
  if (target.role === 'ADMIN' || target.role === 'SUPERADMIN') {
    return isSuperAdminRole(actor.role);
  }
  return false;
}

export function getRoleDashboardPath(role?: UserRole | null): string {
  if (isCoachRole(role)) return '/coach';
  return '/admin/dashboard';
}

export function getRoleLabel(role: UserRole): string {
  if (role === 'COACH') return 'Coach';
  if (role === 'SUPERADMIN') return 'Super Administrator';
  return 'Administrator';
}

export const COACH_PASSWORD_MESSAGE =
  'Coach password resets are managed by an administrator. Please contact your tournament administrator.';

export const ADMIN_PASSWORD_MESSAGE =
  'Administrator passwords can only be reset by a super administrator.';

export const SUPERADMIN_PASSWORD_MESSAGE =
  'Super administrator passwords can only be reset by another super administrator.';
