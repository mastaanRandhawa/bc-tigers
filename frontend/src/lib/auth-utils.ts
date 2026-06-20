import type { UserRole } from '@/types';

export function isAdminRole(role?: UserRole | null): boolean {
  return role === 'ADMIN';
}

export function getRoleDashboardPath(_role?: UserRole | null): string {
  return '/admin/dashboard';
}

export function getRoleLabel(_role: UserRole): string {
  return 'Administrator';
}
