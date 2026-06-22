import {
  canActorResetTargetPassword,
  isStaffRole,
  isSuperAdminRole,
} from './role-utils';

describe('role-utils', () => {
  describe('isStaffRole', () => {
    it('includes admin and superadmin', () => {
      expect(isStaffRole('ADMIN')).toBe(true);
      expect(isStaffRole('SUPERADMIN')).toBe(true);
      expect(isStaffRole('COACH')).toBe(false);
    });
  });

  describe('isSuperAdminRole', () => {
    it('is true only for superadmin', () => {
      expect(isSuperAdminRole('SUPERADMIN')).toBe(true);
      expect(isSuperAdminRole('ADMIN')).toBe(false);
    });
  });

  describe('canActorResetTargetPassword', () => {
    it('allows superadmin to reset admin and superadmin passwords', () => {
      expect(canActorResetTargetPassword('SUPERADMIN', 'ADMIN')).toBe(true);
      expect(canActorResetTargetPassword('SUPERADMIN', 'SUPERADMIN')).toBe(
        true,
      );
    });

    it('denies admin resetting admin or superadmin passwords', () => {
      expect(canActorResetTargetPassword('ADMIN', 'ADMIN')).toBe(false);
      expect(canActorResetTargetPassword('ADMIN', 'SUPERADMIN')).toBe(false);
    });

    it('allows staff to reset coach passwords', () => {
      expect(canActorResetTargetPassword('ADMIN', 'COACH')).toBe(true);
      expect(canActorResetTargetPassword('SUPERADMIN', 'COACH')).toBe(true);
    });

    it('denies coach resetting any password', () => {
      expect(canActorResetTargetPassword('COACH', 'COACH')).toBe(false);
      expect(canActorResetTargetPassword('COACH', 'ADMIN')).toBe(false);
    });
  });
});
