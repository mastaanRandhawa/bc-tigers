jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    bracketNode: { findFirst: jest.fn(), findMany: jest.fn() },
    match: { findMany: jest.fn(), count: jest.fn() },
  },
}));

import {
  resolveAdvancingTeams,
  hasDecisivePenaltyShootout,
  getEliminationCompletionError,
  formatMatchResultLine,
  toEngineMatchResult,
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

    it('returns null on regulation draw without penalties', () => {
      expect(
        resolveAdvancingTeams({ ...base, home_score: 2, away_score: 2 }),
      ).toBeNull();
    });

    it('returns PK winner on regulation draw with decisive penalties', () => {
      expect(
        resolveAdvancingTeams({
          ...base,
          home_score: 2,
          away_score: 2,
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

  describe('getEliminationCompletionError', () => {
    it('allows league draw', () => {
      expect(
        getEliminationCompletionError(
          { ...base, home_score: 0, away_score: 0 },
          false,
        ),
      ).toBeNull();
    });

    it('rejects elimination draw without PK', () => {
      expect(
        getEliminationCompletionError(
          { ...base, home_score: 2, away_score: 2 },
          true,
        ),
      ).toMatch(/penalty shootout/i);
    });

    it('allows elimination draw with decisive PK', () => {
      expect(
        getEliminationCompletionError(
          {
            ...base,
            home_score: 2,
            away_score: 2,
            home_penalties: 5,
            away_penalties: 4,
          },
          true,
        ),
      ).toBeNull();
    });
  });

  describe('formatMatchResultLine', () => {
    it('includes pens suffix for tied knockout', () => {
      expect(formatMatchResultLine(2, 2, 5, 4)).toBe('2 – 2 (5–4 pens)');
    });

    it('omits pens for regulation win', () => {
      expect(formatMatchResultLine(2, 1, 5, 4)).toBe('2 – 1');
    });
  });

  describe('toEngineMatchResult', () => {
    it('maps penalty fields', () => {
      expect(
        toEngineMatchResult({
          ...base,
          home_score: 1,
          away_score: 1,
          home_penalties: 3,
          away_penalties: 4,
        }),
      ).toMatchObject({
        homePenalties: 3,
        awayPenalties: 4,
      });
    });
  });
});
