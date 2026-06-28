import { BadRequestException } from '@nestjs/common';

jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    team: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  },
}));

import prisma from '../../prisma/prisma';
import {
  assertCoachOwnsTeam,
  getCoachTeamId,
  getCoachTeamIds,
  validateCoachCanBeAssigned,
  applyCoachTeamAssignment,
} from './coach-team-link';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('coach-team-link', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getCoachTeamIds', () => {
    it('returns all teams coached by user', async () => {
      mockPrisma.team.findMany.mockResolvedValue([
        { id: 'team-1' },
        { id: 'team-2' },
      ] as never);

      await expect(getCoachTeamIds('coach-1')).resolves.toEqual([
        'team-1',
        'team-2',
      ]);
    });
  });

  describe('getCoachTeamId', () => {
    it('returns requested team when coach owns it', async () => {
      mockPrisma.team.findMany.mockResolvedValue([{ id: 'team-1' }, { id: 'team-2' }] as never);

      await expect(getCoachTeamId('coach-1', 'team-2')).resolves.toBe('team-2');
    });

    it('returns null when coach does not own requested team', async () => {
      mockPrisma.team.findMany.mockResolvedValue([{ id: 'team-1' }] as never);

      await expect(getCoachTeamId('coach-1', 'team-2')).resolves.toBeNull();
    });

    it('returns first team when no team id provided', async () => {
      mockPrisma.team.findMany.mockResolvedValue([{ id: 'team-a' }] as never);

      await expect(getCoachTeamId('coach-1')).resolves.toBe('team-a');
    });
  });

  describe('assertCoachOwnsTeam', () => {
    it('passes when team references coach', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        coach_user_id: 'coach-1',
      } as never);

      await expect(
        assertCoachOwnsTeam('coach-1', 'team-1'),
      ).resolves.toBeUndefined();
    });

    it('fails when team points to a different coach', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        coach_user_id: 'other',
      } as never);

      await expect(
        assertCoachOwnsTeam('coach-1', 'team-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('validateCoachCanBeAssigned', () => {
    it('rejects non-coach users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' } as never);

      await expect(
        validateCoachCanBeAssigned('user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows coaches with existing teams', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'COACH' } as never);

      await expect(
        validateCoachCanBeAssigned('coach-1'),
      ).resolves.toBeUndefined();
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
