import {
  USFA_TOURNAMENT_CONFIG,
  TRADITIONAL_TOURNAMENT_CONFIG,
} from './config';
import {
  computeGroupedStandings,
  type GroupedStandingRow,
  type TeamGroupRef,
} from './standings';
import type { MatchResult } from './types';

const USFA = USFA_TOURNAMENT_CONFIG;

function played(
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
  extra: Partial<MatchResult> = {},
): MatchResult {
  return {
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    outcome: 'PLAYED',
    ...extra,
  };
}

function team(id: string, groupId: string | null): TeamGroupRef {
  return { id, groupId };
}

/** Pull the single row for a team out of a grouped table (fails loudly if absent). */
function rowFor(table: GroupedStandingRow[], teamId: string): GroupedStandingRow {
  const row = table.find((r) => r.teamId === teamId);
  if (!row) throw new Error(`No standings row for team ${teamId}`);
  return row;
}

describe('computeGroupedStandings', () => {
  // ─── Grouping disabled ─────────────────────────────────────────────────────
  describe('when grouping is disabled', () => {
    it('produces one flat table with every row tagged groupId: null', () => {
      const teams = [team('a', 'g1'), team('b', 'g2'), team('c', 'g1')];
      const results = [
        played('a', 'b', 3, 0), // a:10
        played('a', 'c', 1, 0), // a:8 → a total 18
        played('b', 'c', 0, 0), // b:4, c:4
      ];

      const table = computeGroupedStandings(teams, results, USFA, false);

      expect(table.every((r) => r.groupId === null)).toBe(true);
      // The group labels on the teams are ignored — a beat everyone, ranks #1.
      expect(rowFor(table, 'a').rank).toBe(1);
      expect(rowFor(table, 'a').points).toBe(18);
      expect(table).toHaveLength(3);
    });

    it('counts cross-"group" matches because the groups are ignored', () => {
      const teams = [team('a', 'g1'), team('b', 'g2')];
      const results = [played('a', 'b', 2, 1)];

      const table = computeGroupedStandings(teams, results, USFA, false);

      expect(rowFor(table, 'a').played).toBe(1);
      expect(rowFor(table, 'b').played).toBe(1);
    });
  });

  // ─── Grouping enabled ──────────────────────────────────────────────────────
  describe('when grouping is enabled', () => {
    it('ranks each group independently, restarting ranks from 1 per group', () => {
      const teams = [
        team('a', 'g1'),
        team('b', 'g1'),
        team('c', 'g2'),
        team('d', 'g2'),
      ];
      const results = [
        played('a', 'b', 3, 0), // g1: a beats b
        played('c', 'd', 0, 2), // g2: d beats c
      ];

      const table = computeGroupedStandings(teams, results, USFA, true);

      // Each group has its own rank-1 winner.
      expect(rowFor(table, 'a').rank).toBe(1);
      expect(rowFor(table, 'b').rank).toBe(2);
      expect(rowFor(table, 'd').rank).toBe(1);
      expect(rowFor(table, 'c').rank).toBe(2);

      // Rows are tagged with their owning group.
      expect(rowFor(table, 'a').groupId).toBe('g1');
      expect(rowFor(table, 'd').groupId).toBe('g2');
    });

    it('excludes cross-group matches from every group table', () => {
      // a and b are in g1; c is in g2. a vs c is a cross-group fixture and must
      // not affect either group's record.
      const teams = [team('a', 'g1'), team('b', 'g1'), team('c', 'g2')];
      const results = [
        played('a', 'b', 1, 0), // counts toward g1
        played('a', 'c', 5, 0), // cross-group: must be ignored everywhere
      ];

      const table = computeGroupedStandings(teams, results, USFA, true);

      // a only played b (1 match), not the cross-group blowout against c.
      const a = rowFor(table, 'a');
      expect(a.played).toBe(1);
      expect(a.goalsFor).toBe(1);
      expect(a.goalsAgainst).toBe(0);

      // c never played a counted match — it is winless and goalless, alone in g2.
      const c = rowFor(table, 'c');
      expect(c.played).toBe(0);
      expect(c.points).toBe(0);
      expect(c.rank).toBe(1);
      expect(c.groupId).toBe('g2');
    });

    it('buckets teams with no group assignment into a single null group', () => {
      const teams = [
        team('a', null),
        team('b', null),
        team('c', 'g1'),
      ];
      const results = [
        played('a', 'b', 2, 0), // ungrouped table
        played('a', 'c', 9, 0), // cross-bucket: ignored
      ];

      const table = computeGroupedStandings(teams, results, USFA, true);

      const a = rowFor(table, 'a');
      expect(a.groupId).toBe(null);
      expect(a.rank).toBe(1);
      expect(a.played).toBe(1); // only the a-vs-b match counted
      expect(rowFor(table, 'b').groupId).toBe(null);
      expect(rowFor(table, 'c').groupId).toBe('g1');
    });

    it('returns a row for every team even when no matches have been played', () => {
      const teams = [team('a', 'g1'), team('b', 'g1'), team('c', 'g2')];

      const table = computeGroupedStandings(teams, [], USFA, true);

      expect(table).toHaveLength(3);
      expect(table.every((r) => r.played === 0 && r.points === 0)).toBe(true);
      // Both members of g1 share rank 1 only if a tiebreak leaves them level —
      // with no matches the deterministic coin toss still yields distinct ranks.
      const g1 = table.filter((r) => r.groupId === 'g1');
      expect(g1.map((r) => r.rank).sort()).toEqual([1, 2]);
    });

    it('applies the configured tiebreakers within a group', () => {
      // Traditional 3-point system (no goal bonuses) so the two leaders stay level
      // on points and the GOALS_AGAINST tiebreaker is what actually decides it.
      const cfg = {
        ...TRADITIONAL_TOURNAMENT_CONFIG,
        tiebreakers: ['GOALS_AGAINST' as const, 'COIN_TOSS' as const],
      };
      const teams = [team('a', 'g1'), team('b', 'g1'), team('c', 'g1')];
      const results = [
        played('a', 'b', 1, 1), // a & b level head-to-head (1 pt each)
        played('a', 'c', 1, 0), // a wins, concedes 0 → a total 4 pts, 1 against
        played('b', 'c', 3, 2), // b wins, concedes 2 → b total 4 pts, 3 against
      ];

      const table = computeGroupedStandings(teams, results, cfg, true);

      // a and b finish level on 4 points; a concedes fewer, so ranks above b.
      expect(rowFor(table, 'a').points).toBe(rowFor(table, 'b').points);
      expect(rowFor(table, 'a').rank).toBeLessThan(rowFor(table, 'b').rank);
    });
  });
});
