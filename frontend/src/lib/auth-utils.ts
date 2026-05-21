import type { User, UserRole } from '@/types';

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'TOURNAMENT_ADMIN'];

export function isAdminRole(role?: UserRole | null): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

export function getRoleDashboardPath(role?: UserRole | null): string {
  switch (role) {
    case 'ADMIN':
    case 'TOURNAMENT_ADMIN':
      return '/management/dashboard';
    case 'REFEREE':
      return '/referee';
    case 'PLAYER':
      return '/player';
    default:
      return '/tournaments';
  }
}

export function getUserDisplayName(
  user: Pick<User, 'first_name' | 'last_name' | 'email'> | null,
): string {
  if (!user) return '';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return name || user.email;
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    ADMIN: 'Administrator',
    TOURNAMENT_ADMIN: 'Tournament Admin',
    COACH: 'Coach',
    REFEREE: 'Referee',
    PLAYER: 'Player',
    VIEWER: 'Viewer',
  };
  return labels[role];
}

export { getPostLoginPath } from '@/lib/coach-utils';
