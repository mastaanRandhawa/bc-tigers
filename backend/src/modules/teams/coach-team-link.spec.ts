import { BadRequestException } from '@nestjs/common';

jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    team: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  },
}));

import prisma from '../../prisma/prisma';
import {
  assertBidirectionalCoachTeamLink,
  getCoachTeamId,
  validateCoachCanBeAssigned,
  applyCoachTeamAssignment,
} from './coach-team-link';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('coach-team-link', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getCoachTeamId', () => {
    it('returns team id when both sides of the link agree', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        coached_team: { id: 'team-1', coach_user_id: 'coach-1' },
      } as never);

      await expect(getCoachTeamId('coach-1')).resolves.toBe('team-1');
    });

    it('returns null when coach_user_id on team does not match user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        coached_team: { id: 'team-1', coach_user_id: 'other-coach' },
      } as never);

      await expect(getCoachTeamId('coach-1')).resolves.toBeNull();
    });
  });

  describe('assertBidirectionalCoachTeamLink', () => {
    it('passes when team and coach references match', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({ coach_user_id: 'coach-1' } as never);
      mockPrisma.user.findUnique.mockResolvedValue({
        coached_team: { id: 'team-1' },
      } as never);

      await expect(
        assertBidirectionalCoachTeamLink('coach-1', 'team-1'),
      ).resolves.toBeUndefined();
    });

    it('fails when team points to a different coach', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({ coach_user_id: 'other' } as never);

      await expect(
        assertBidirectionalCoachTeamLink('coach-1', 'team-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('validateCoachCanBeAssigned', () => {
    it('rejects non-coach users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN',
        coached_team: null,
      } as never);

      await expect(validateCoachCanBeAssigned('user-1', 'team-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects coach already assigned elsewhere', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: 'COACH',
        coached_team: { id: 'team-other', name: 'Other FC' },
      } as never);

      await expect(validateCoachCanBeAssigned('coach-1', 'team-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('applyCoachTeamAssignment', () => {
    it('clears coach_user_id when unassigning', async () => {
      mockPrisma.team.update.mockResolvedValue({} as never);

      await applyCoachTeamAssignment('team-1', null);

      expect(mockPrisma.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { coach_user_id: null },
      });
    });
  });
});
