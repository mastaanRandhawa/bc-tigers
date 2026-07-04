jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    bracketNode: { findFirst: jest.fn(), findMany: jest.fn() },
    match: { findMany: jest.fn(), count: jest.fn() },
  },
}));

import prisma from '../../prisma/prisma';
import {
  resolveAdvancingTeams,
  hasDecisivePenaltyShootout,
  getTiedCompletionError,
  formatMatchResultLine,
  toEngineMatchResult,
  standingsExcludedMatchIdsForDivision,
} from './match-outcome';

describe('match-outcome (pure)', () => {
  const base = {
    id: 'm1',
    home_team_id: 'home',
    away_team_id: 'away',
  };

  describe('resolveAdvancingTeams', () => {
    it('returns winner/loser on regulation win', () => {
      expect(
        resolveAdvancingTeams({ ...base, home_score: 2, away_score: 1 }),
      ).toEqual({
        winnerId: 'home',
        loserId: 'away',
      });
    });

    it('returns null on regulation draw recorded as DRAW', () => {
      expect(
        resolveAdvancingTeams({
          ...base,
          home_score: 2,
          away_score: 2,
          tie_resolution: 'DRAW',
        }),
      ).toBeNull();
    });

    it('returns null on tied score without a resolution', () => {
      expect(
        resolveAdvancingTeams({ ...base, home_score: 2, away_score: 2 }),
      ).toBeNull();
    });

    it('returns PK winner when tie_resolution is PENALTIES', () => {
      expect(
        resolveAdvancingTeams({
          ...base,
          home_score: 2,
          away_score: 2,
          tie_resolution: 'PENALTIES',
          home_penalties: 4,
          away_penalties: 5,
        }),
      ).toEqual({ winnerId: 'away', loserId: 'home' });
    });

    it('returns null when penalties are level', () => {
      expect(
        resolveAdvancingTeams({
          ...base,
          home_score: 1,
          away_score: 1,
          tie_resolution: 'PENALTIES',
          home_penalties: 3,
          away_penalties: 3,
        }),
      ).toBeNull();
    });
  });

  describe('hasDecisivePenaltyShootout', () => {
    it('is false when regulation is decisive', () => {
      expect(
        hasDecisivePenaltyShootout({
          ...base,
          home_score: 1,
          away_score: 0,
          home_penalties: 5,
          away_penalties: 4,
        }),
      ).toBe(false);
    });

    it('is true when tied with unequal penalties', () => {
      expect(
        hasDecisivePenaltyShootout({
          ...base,
          home_score: 2,
          away_score: 2,
          home_penalties: 5,
          away_penalties: 4,
        }),
      ).toBe(true);
    });
  });

  describe('getTiedCompletionError', () => {
    it('allows non-tied scores', () => {
      expect(
        getTiedCompletionError({ ...base, home_score: 1, away_score: 0 }),
      ).toBeNull();
    });

    it('requires an explicit choice when tied', () => {
      expect(
        getTiedCompletionError({ ...base, home_score: 0, away_score: 0 }),
      ).toMatch(/choose whether to record a draw/i);
    });

    it('allows a recorded draw', () => {
      expect(
        getTiedCompletionError({
          ...base,
          home_score: 2,
          away_score: 2,
          tie_resolution: 'DRAW',
        }),
      ).toBeNull();
    });

    it('requires decisive penalties when shootout is selected', () => {
      expect(
        getTiedCompletionError({
          ...base,
          home_score: 2,
          away_score: 2,
          tie_resolution: 'PENALTIES',
        }),
      ).toMatch(/penalty shootout/i);
    });

    it('allows shootout when penalties are decisive', () => {
      expect(
        getTiedCompletionError({
          ...base,
          home_score: 2,
          away_score: 2,
          tie_resolution: 'PENALTIES',
          home_penalties: 5,
          away_penalties: 4,
        }),
      ).toBeNull();
    });
  });

  describe('formatMatchResultLine', () => {
    it('includes pens suffix when tie was broken on penalties', () => {
      expect(formatMatchResultLine(2, 2, 5, 4, 'PENALTIES')).toBe(
        '2 – 2 (5–4 pens)',
      );
    });

    it('omits pens for a recorded draw', () => {
      expect(formatMatchResultLine(2, 2, 5, 4, 'DRAW')).toBe('2 – 2');
    });

    it('omits pens for regulation win', () => {
      expect(formatMatchResultLine(2, 1, 5, 4, 'PENALTIES')).toBe('2 – 1');
    });
  });

  describe('toEngineMatchResult', () => {
    it('maps penalty fields only when tie_resolution is PENALTIES', () => {
      expect(
        toEngineMatchResult({
          ...base,
          home_score: 1,
          away_score: 1,
          tie_resolution: 'PENALTIES',
          home_penalties: 3,
          away_penalties: 4,
        }),
      ).toMatchObject({
        homePenalties: 3,
        awayPenalties: 4,
      });

      expect(
        toEngineMatchResult({
          ...base,
          home_score: 1,
          away_score: 1,
          tie_resolution: 'DRAW',
          home_penalties: 3,
          away_penalties: 4,
        }),
      ).toMatchObject({
        homePenalties: null,
        awayPenalties: null,
      });
    });
  });

  describe('standingsExcludedMatchIdsForDivision', () => {
    it('only excludes bracket-linked matches, not pool source games', async () => {
      const mockPrisma = prisma as {
        bracketNode: { findMany: jest.Mock };
        match: { findMany: jest.Mock };
      };
      mockPrisma.bracketNode.findMany.mockResolvedValue([
        { match_id: 'ko-final' },
      ]);

      const ids = await standingsExcludedMatchIdsForDivision('div-1');

      expect(ids).toEqual(new Set(['ko-final']));
      expect(mockPrisma.match.findMany).not.toHaveBeenCalled();
    });
  });
});
