jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    match: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    bracketNode: { findFirst: jest.fn(), findMany: jest.fn() },
    matchEvent: { findMany: jest.fn() },
    user: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

jest.mock('../auth/roster-visibility', () => ({
  getRosterVisibilityContext: jest.fn().mockResolvedValue({
    actor: null,
    rostersPublic: true,
  }),
  canViewTeamRoster: jest.fn().mockReturnValue(true),
  stripTeamPlayers: jest.fn((team: unknown) => team),
}));

jest.mock('../teams/team-membership', () => ({
  enrichMatchWithTeamSlugs: jest.fn((m: unknown) => m),
  enrichMatchesWithTeamSlugs: jest.fn((m: unknown[]) => m),
  assertTeamsInDivision: jest.fn(),
}));

import { BadRequestException } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { asMockedPrisma } from '../../test-utils/prisma-mock';
import { MatchesService } from './matches.service';

const mockPrisma = asMockedPrisma(prisma);

const baseMatch = {
  id: 'match-1',
  tournament_id: 't1',
  division_id: 'div-1',
  home_team_id: 'home',
  away_team_id: 'away',
  home_score: 0,
  away_score: 0,
  home_penalties: null,
  away_penalties: null,
  tie_resolution: null,
  status: 'LIVE' as const,
  scheduled_start: new Date(),
  home_team: { id: 'home', name: 'Home FC', coach_user_id: null, players: [] },
  away_team: { id: 'away', name: 'Away FC', coach_user_id: null, players: [] },
  home_source: null,
  away_source: null,
  home_source_group: null,
  away_source_group: null,
  venue: null,
  field: null,
  officials: [],
  events: [],
  tournament: { id: 't1', name: 'Cup', slug: 'cup' },
  division: {
    id: 'div-1',
    slug: 'u12',
    name: 'U12',
    tournament: { id: 't1', name: 'Cup', slug: 'cup' },
  },
};

describe('MatchesService tied-score completion', () => {
  const gateway = {
    emitMatchCompleted: jest.fn(),
    emitMatchStarted: jest.fn(),
    emitScoreUpdate: jest.fn(),
    emitBracketUpdated: jest.fn(),
    emitMatchUpdated: jest.fn(),
    refreshStandings: jest.fn(),
  };
  const bracketsService = { advance: jest.fn() };
  const mailService = { send: jest.fn() };
  const service = new MatchesService(
    gateway as never,
    bracketsService as never,
    mailService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.bracketNode.findFirst.mockResolvedValue(null);
    mockPrisma.bracketNode.findMany.mockResolvedValue([]);
    mockPrisma.match.findMany.mockResolvedValue([]);
    mockPrisma.match.count.mockResolvedValue(0);
    mockPrisma.match.update.mockImplementation(async ({ data }) => ({
      ...baseMatch,
      ...data,
    }));
    mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
  });

  describe('update → COMPLETED', () => {
    it('allows 0–0 draw completion when tie_resolution is DRAW', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        home_score: 0,
        away_score: 0,
        tie_resolution: 'DRAW',
      });

      await expect(
        service.update('match-1', { status: 'COMPLETED' }),
      ).resolves.toBeDefined();

      expect(gateway.emitMatchCompleted).toHaveBeenCalled();
      expect(bracketsService.advance).not.toHaveBeenCalled();
    });

    it('rejects tied completion without an explicit tie resolution', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        home_score: 2,
        away_score: 2,
        tie_resolution: null,
      });

      await expect(
        service.update('match-1', { status: 'COMPLETED' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows tied completion with decisive penalties', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        home_score: 2,
        away_score: 2,
        tie_resolution: 'PENALTIES',
        home_penalties: 5,
        away_penalties: 4,
      });
      mockPrisma.bracketNode.findFirst.mockResolvedValue({
        id: 'node-1',
        match_id: 'match-1',
      });
      mockPrisma.match.update.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 2,
        away_score: 2,
        tie_resolution: 'PENALTIES',
        home_penalties: 5,
        away_penalties: 4,
      });

      await service.update('match-1', { status: 'COMPLETED' });

      expect(bracketsService.advance).toHaveBeenCalledWith(
        'node-1',
        'home',
        'match',
      );
    });
  });

  describe('updateScore', () => {
    it('saves a normal draw without penalties', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(baseMatch);

      await service.updateScore('match-1', 1, 1, { tie_resolution: 'DRAW' });

      expect(mockPrisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            home_score: 1,
            away_score: 1,
            tie_resolution: 'DRAW',
            home_penalties: null,
            away_penalties: null,
          }),
        }),
      );
    });

    it('rejects PENALTIES selection without shootout totals on completed match', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 2,
        away_score: 2,
        tie_resolution: 'PENALTIES',
      });

      await expect(
        service.updateScore('match-1', 2, 2, { tie_resolution: 'PENALTIES' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('advances PK winner when penalties saved on completed match', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 2,
        away_score: 2,
        tie_resolution: 'PENALTIES',
      });
      mockPrisma.bracketNode.findFirst.mockResolvedValue({
        id: 'node-1',
        match_id: 'match-1',
      });
      mockPrisma.match.update.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 2,
        away_score: 2,
        tie_resolution: 'PENALTIES',
        home_penalties: 4,
        away_penalties: 5,
      });

      await service.updateScore('match-1', 2, 2, {
        tie_resolution: 'PENALTIES',
        home_penalties: 4,
        away_penalties: 5,
      });

      expect(bracketsService.advance).toHaveBeenCalledWith(
        'node-1',
        'away',
        'match',
      );
    });

    it('leaves non-tied match behavior unchanged', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(baseMatch);

      await service.updateScore('match-1', 3, 1);

      expect(mockPrisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            home_score: 3,
            away_score: 1,
            tie_resolution: null,
            home_penalties: null,
            away_penalties: null,
          }),
        }),
      );
    });
  });
});
