import { ForbiddenException, NotFoundException } from '@nestjs/common';

jest.mock('../teams/coach-team-link', () => ({
  getCoachTeamId: jest.fn(),
}));

jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    team: {
      findUnique: jest.fn(),
    },
    siteSettings: {
      findUnique: jest.fn(),
    },
  },
}));

import prisma from '../../prisma/prisma';
import {
  assertCoachCanEditTeam,
  isCoachManagementLocked,
} from './coach-permissions';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('coach-permissions', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('assertCoachCanEditTeam', () => {
    it('allows edit when coach owns team and no locks', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        coach_user_id: 'coach-1',
        management_locked: false,
      } as never);
      mockPrisma.siteSettings.findUnique.mockResolvedValue({
        coach_management_locked: false,
      } as never);

      await expect(assertCoachCanEditTeam('coach-1', 'team-1')).resolves.toBeUndefined();
    });

    it('denies when team is not assigned to coach', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        coach_user_id: 'other-coach',
        management_locked: false,
      } as never);

      await expect(assertCoachCanEditTeam('coach-1', 'team-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('denies when global coach lock is enabled', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        coach_user_id: 'coach-1',
        management_locked: false,
      } as never);
      mockPrisma.siteSettings.findUnique.mockResolvedValue({
        coach_management_locked: true,
      } as never);

      await expect(assertCoachCanEditTeam('coach-1', 'team-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('denies when team management is locked', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        coach_user_id: 'coach-1',
        management_locked: true,
      } as never);
      mockPrisma.siteSettings.findUnique.mockResolvedValue({
        coach_management_locked: false,
      } as never);

      await expect(assertCoachCanEditTeam('coach-1', 'team-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws when team does not exist', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(null);
      await expect(assertCoachCanEditTeam('coach-1', 'team-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('isCoachManagementLocked', () => {
    it('returns true when site setting is locked', async () => {
      mockPrisma.siteSettings.findUnique.mockResolvedValue({
        coach_management_locked: true,
      } as never);
      await expect(isCoachManagementLocked()).resolves.toBe(true);
    });
  });
});
