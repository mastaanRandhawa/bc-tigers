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

/**
 * Whether `actorRole` may create/modify/delete a user whose role is `targetRole`.
 * Mirrors the password-reset hierarchy: any staff member can manage COACH
 * accounts, but only a SUPERADMIN may manage ADMIN/SUPERADMIN accounts (which
 * includes assigning those roles). Prevents an ADMIN from minting or removing a
 * SUPERADMIN.
 */
export function canActorManageTarget(
  actorRole: UserRole,
  targetRole: UserRole,
): boolean {
  if (targetRole === 'COACH') return isStaffRole(actorRole);
  return isSuperAdminRole(actorRole);
}
