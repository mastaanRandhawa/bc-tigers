import type { UserRole } from '@prisma/client';

export function isStaffRole(role?: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

export function isSuperAdminRole(role?: UserRole | null): boolean {
  return role === 'SUPERADMIN';
}

export function canActorResetTargetPassword(
  actorRole: UserRole,
  targetRole: UserRole,
): boolean {
  if (targetRole === 'COACH') return isStaffRole(actorRole);
  if (targetRole === 'ADMIN' || targetRole === 'SUPERADMIN') {
    return isSuperAdminRole(actorRole);
  }
  return false;
}
