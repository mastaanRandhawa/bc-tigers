import type { User, UserRole } from '@/types';

export function isAdminRole(role?: UserRole | null): boolean {
  return role === 'ADMIN';
}

export function getRoleDashboardPath(_role?: UserRole | null): string {
  return '/admin/dashboard';
}

export function getUserDisplayName(user: Pick<User, 'first_name' | 'last_name' | 'email'> | null): string {
  if (!user) return '';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return name || user.email;
}

export function getPostLoginPath(_user: Pick<User, 'role'> | null): string {
  return '/admin/dashboard';
}

export function getRoleLabel(_role: UserRole): string {
  return 'Administrator';
}
