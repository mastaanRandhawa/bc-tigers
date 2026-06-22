import type { UserRole } from '@/types';

export function isAdminRole(role?: UserRole | null): boolean {
  return role === 'ADMIN';
}

export function isCoachRole(role?: UserRole | null): boolean {
  return role === 'COACH';
}

export function getRoleDashboardPath(role?: UserRole | null): string {
  if (isCoachRole(role)) return '/coach';
  return '/admin/dashboard';
}

export function getRoleLabel(role: UserRole): string {
  if (role === 'COACH') return 'Coach';
  return 'Administrator';
}

export const COACH_PASSWORD_MESSAGE =
  'Coach password resets are managed by an administrator. Please contact your tournament administrator.';
