jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    match: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    bracketNode: { findFirst: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    tournament: {
      findUnique: jest.fn().mockResolvedValue({
        status: 'ACTIVE',
        admin_editing_enabled: true,
        name: 'Cup',
      }),
    },
    matchEvent: { findMany: jest.fn() },
    user: { findMany: jest.fn().mockResolvedValue([]) },
    standing: { findFirst: jest.fn() },
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
  const bracketsService = {
    advance: jest.fn(),
    clearNodeWinner: jest.fn(),
    syncNodeTeamsFromMatchByMatchId: jest.fn(),
  };
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
    mockPrisma.bracketNode.updateMany.mockResolvedValue({ count: 0 });
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

    it('rejects draw completion on bracket-linked elimination match', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        home_score: 0,
        away_score: 0,
        tie_resolution: 'DRAW',
      });
      mockPrisma.bracketNode.findFirst.mockResolvedValue({
        id: 'node-1',
        match_id: 'match-1',
      });

      await expect(
        service.update('match-1', { status: 'COMPLETED' }),
      ).rejects.toThrow(BadRequestException);

      expect(gateway.emitMatchCompleted).not.toHaveBeenCalled();
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
          }),
        }),
      );
    });

    it('allows tied score on live knockout match without tie resolution', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        status: 'LIVE',
        home_score: 0,
        away_score: 0,
      });
      mockPrisma.bracketNode.findFirst.mockResolvedValue({
        id: 'node-1',
        match_id: 'match-1',
      });

      await expect(service.updateScore('match-1', 1, 1)).resolves.toBeDefined();
    });
  });

  describe('placeholder slot reconciliation', () => {
    // A dependent game whose HOME slot is "Winner of match-1".
    const dependent = {
      ...baseMatch,
      id: 'dep-1',
      home_team_id: 'home', // already resolved to the previous winner
      away_team_id: 'other',
      home_source_match_id: 'match-1',
      home_source_outcome: 'WINNER' as const,
      away_source_match_id: null,
      away_source_outcome: null,
      status: 'SCHEDULED' as const,
    };

    // Return dependents only for the reconcile query; [] for positional/other.
    const onlyDependents = (dep: unknown[]) => {
      mockPrisma.match.findMany.mockImplementation(async (args?: unknown) => {
        const where = (args as { where?: { OR?: Array<Record<string, unknown>> } })
          ?.where;
        const isDependentQuery = where?.OR?.some(
          (c) => 'home_source_match_id' in c || 'away_source_match_id' in c,
        );
        return isDependentQuery ? dep : [];
      });
    };

    it('fills a dependent slot with the winner when the source completes decisively', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
      });
      mockPrisma.match.update.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 3,
        away_score: 1, // home wins
      });
      onlyDependents([{ ...dependent, home_team_id: null }]);

      await service.updateScore('match-1', 3, 1);

      expect(mockPrisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dep-1' },
          data: expect.objectContaining({ home_team_id: 'home' }),
        }),
      );
    });

    it('flips a dependent slot to the new winner when the source result changes', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
      });
      mockPrisma.match.update.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 1,
        away_score: 3, // away now wins
      });
      onlyDependents([dependent]); // was resolved to 'home'

      await service.updateScore('match-1', 1, 3);

      expect(mockPrisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dep-1' },
          data: expect.objectContaining({ home_team_id: 'away' }),
        }),
      );
    });

    it('reverts a dependent slot to a placeholder when the source is no longer decisive', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
      });
      mockPrisma.match.update.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 2,
        away_score: 2,
        tie_resolution: 'DRAW', // draw → no winner
      });
      onlyDependents([dependent]); // currently resolved to 'home'

      await service.updateScore('match-1', 2, 2, { tie_resolution: 'DRAW' });

      expect(mockPrisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dep-1' },
          data: expect.objectContaining({ home_team_id: null }),
        }),
      );
    });

    it('does not resolve a dependent off a source that is not yet COMPLETED', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        status: 'LIVE',
      });
      mockPrisma.match.update.mockResolvedValue({
        ...baseMatch,
        status: 'LIVE',
        home_score: 3,
        away_score: 1,
      });
      onlyDependents([{ ...dependent, home_team_id: null }]);

      await service.updateScore('match-1', 3, 1);

      // The dependent slot must stay null while the source game is still live.
      expect(mockPrisma.match.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'dep-1' } }),
      );
    });

    it('fills this match’s own slot on update when it points at an already-completed source', async () => {
      // findOne(self) → self with a placeholder home slot; reconcileOwnSlots then
      // reads self again and its completed source, and fills the slot.
      mockPrisma.match.findUnique.mockImplementation(async (args?: unknown) => {
        const id = (args as { where?: { id?: string } })?.where?.id;
        if (id === 'source-1') {
          return {
            ...baseMatch,
            id: 'source-1',
            status: 'COMPLETED',
            home_team_id: 'home',
            away_team_id: 'away',
            home_score: 4,
            away_score: 0, // home wins
          };
        }
        // self ('dep-1'): a game whose home side is "Winner of source-1".
        return {
          ...baseMatch,
          id: 'dep-1',
          home_team_id: null,
          home_source_match_id: 'source-1',
          home_source_outcome: 'WINNER',
        };
      });
      mockPrisma.match.findMany.mockResolvedValue([
        {
          ...baseMatch,
          id: 'source-1',
          status: 'COMPLETED',
          home_team_id: 'home',
          away_team_id: 'away',
          home_score: 4,
          away_score: 0,
        },
      ]);
      mockPrisma.match.update.mockResolvedValue({ ...baseMatch, id: 'dep-1' });

      await service.update('dep-1', { scheduled_start: baseMatch.scheduled_start });

      expect(mockPrisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dep-1' },
          data: expect.objectContaining({ home_team_id: 'home' }),
        }),
      );
    });
  });

  describe('bracket sync from match (match is the source of truth)', () => {
    it('advances the linked bracket node when the match is completed decisively', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        home_score: 3,
        away_score: 1,
      });
      mockPrisma.match.update.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 3,
        away_score: 1, // home wins
      });
      mockPrisma.bracketNode.findFirst.mockResolvedValue({
        id: 'node-1',
        winner_id: null,
        auto_advanced: false,
      });

      await service.update('match-1', { status: 'COMPLETED' });

      expect(bracketsService.advance).toHaveBeenCalledWith(
        'node-1',
        'home',
        'match',
      );
      expect(bracketsService.clearNodeWinner).not.toHaveBeenCalled();
    });

    it('un-advances the bracket node when a decided match is re-opened', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 3,
        away_score: 1,
      });
      mockPrisma.match.update.mockResolvedValue({
        ...baseMatch,
        status: 'LIVE',
        home_score: 3,
        away_score: 1,
      });
      mockPrisma.bracketNode.findFirst.mockResolvedValue({
        id: 'node-1',
        winner_id: 'home', // was decided
        auto_advanced: false,
      });

      await service.update('match-1', { status: 'LIVE' });

      expect(bracketsService.clearNodeWinner).toHaveBeenCalledWith('node-1');
      expect(bracketsService.advance).not.toHaveBeenCalled();
    });

    it('re-advances to the new winner when a completed match result is flipped', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 3,
        away_score: 1,
      });
      mockPrisma.match.update.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 1,
        away_score: 4, // away now wins
      });
      mockPrisma.bracketNode.findFirst.mockResolvedValue({
        id: 'node-1',
        winner_id: 'home',
        auto_advanced: false,
      });

      await service.updateScore('match-1', 1, 4);

      expect(bracketsService.advance).toHaveBeenCalledWith(
        'node-1',
        'away',
        'match',
      );
    });

    it('never touches a BYE (auto-advanced) node from a match', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        home_score: 3,
        away_score: 1,
      });
      mockPrisma.match.update.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 3,
        away_score: 1,
      });
      mockPrisma.bracketNode.findFirst.mockResolvedValue({
        id: 'node-bye',
        winner_id: 'home',
        auto_advanced: true,
      });

      await service.update('match-1', { status: 'COMPLETED' });

      expect(bracketsService.advance).not.toHaveBeenCalled();
      expect(bracketsService.clearNodeWinner).not.toHaveBeenCalled();
    });

    it('does nothing for a match not linked to any bracket node', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        home_score: 3,
        away_score: 1,
      });
      mockPrisma.match.update.mockResolvedValue({
        ...baseMatch,
        status: 'COMPLETED',
        home_score: 3,
        away_score: 1,
      });
      mockPrisma.bracketNode.findFirst.mockResolvedValue(null);

      await service.update('match-1', { status: 'COMPLETED' });

      expect(bracketsService.advance).not.toHaveBeenCalled();
      expect(bracketsService.clearNodeWinner).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('refreshes standings when a completed match is deleted', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        status: 'COMPLETED',
        division_id: 'div-1',
      });
      mockPrisma.match.delete.mockResolvedValue({ id: 'match-1' });

      await service.remove('match-1');

      expect(gateway.refreshStandings).toHaveBeenCalledWith('div-1');
    });

    it('does not refresh standings when a scheduled match is deleted', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        status: 'SCHEDULED',
        division_id: 'div-1',
      });
      mockPrisma.match.delete.mockResolvedValue({ id: 'match-1' });

      await service.remove('match-1');

      expect(gateway.refreshStandings).not.toHaveBeenCalled();
    });
  });
});
