import {
  USFA_TOURNAMENT_CONFIG,
  TRADITIONAL_TOURNAMENT_CONFIG,
  resolveTournamentConfig,
  pointsFor,
  scoreMatch,
  computeStandings,
  resolveKnockoutMatch,
  resolveShootout,
  forfeitResult,
  isAutomaticForfeit,
  normalizeResult,
  selectAdvancingTeams,
  resolveBracketSize,
  phasesForFormat,
} from './index';
import type { MatchResult, TournamentConfig } from './types';

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

// ─── Point system ────────────────────────────────────────────────────────────

describe('USFA 10-point scoring', () => {
  it.each([
    [3, 0, 10], // win + shutout + 3 goal bonus
    [2, 0, 9], // win + shutout + 2 goal bonus
    [4, 2, 9], // win + 0 shutout + capped 3 goal bonus
    [1, 0, 8], // win + shutout + 1 goal bonus
    [0, 0, 4], // draw + shutout
    [2, 2, 5], // draw + 2 goal bonus
    [5, 5, 6], // draw + capped 3 goal bonus
  ])('%i-%i earns the winner/scorer %i points', (gf, ga, expected) => {
    expect(pointsFor(gf, ga, USFA.pointSystem)).toBe(expected);
  });

  it('caps the goal bonus at 3', () => {
    expect(pointsFor(7, 1, USFA.pointSystem)).toBe(6 + 0 + 3);
  });

  it('awards goal bonus on a loss by default (USFA)', () => {
    // loss base 0 + 2 goals scored, conceded 3 so no shutout
    expect(pointsFor(2, 3, USFA.pointSystem)).toBe(2);
  });

  it('can be configured to withhold bonuses on a loss', () => {
    const cfg = resolveTournamentConfig({
      pointSystem: { applyBonusesOnLoss: false },
    });
    expect(pointsFor(2, 3, cfg.pointSystem)).toBe(0);
  });

  it('scoreMatch returns symmetric points for both sides', () => {
    const pts = scoreMatch(played('a', 'b', 3, 0), USFA);
    expect(pts).toEqual({ home: 10, away: 0 });
  });
});

describe('traditional 3-point scoring', () => {
  it.each([
    [3, 0, 3],
    [2, 0, 3],
    [0, 0, 1],
    [1, 2, 0],
  ])('%i-%i earns %i points with no bonuses', (gf, ga, expected) => {
    expect(pointsFor(gf, ga, TRADITIONAL_TOURNAMENT_CONFIG.pointSystem)).toBe(
      expected,
    );
  });
});

// ─── Forfeits ────────────────────────────────────────────────────────────────

describe('forfeits', () => {
  it('records a forfeit as a 2-0 win for the present team', () => {
    const result = forfeitResult('home', 'away', 'away', USFA);
    expect(result).toMatchObject({
      homeScore: 2,
      awayScore: 0,
      outcome: 'FORFEIT',
    });
  });

  it('normalizes a forfeit scoreline regardless of stored score', () => {
    const raw = played('home', 'away', 5, 5, {
      outcome: 'FORFEIT',
      forfeitedBy: 'home',
    });
    expect(normalizeResult(raw, USFA)).toMatchObject({
      homeScore: 0,
      awayScore: 2,
    });
  });

  it('scores a 2-0 forfeit through the point system by default (9 points)', () => {
    const pts = scoreMatch(forfeitResult('home', 'away', 'away', USFA), USFA);
    expect(pts).toEqual({ home: 9, away: 0 });
  });

  it('can award only flat win points for forfeits', () => {
    const cfg = resolveTournamentConfig({ forfeit: { awardBonuses: false } });
    const pts = scoreMatch(forfeitResult('home', 'away', 'away', cfg), cfg);
    expect(pts).toEqual({
      home: cfg.pointSystem.win,
      away: cfg.pointSystem.loss,
    });
  });

  it('flags teams more than 10 minutes late as automatic forfeits', () => {
    expect(isAutomaticForfeit(11, USFA)).toBe(true);
    expect(isAutomaticForfeit(10, USFA)).toBe(false);
    expect(isAutomaticForfeit(0, USFA)).toBe(false);
  });
});

// ─── Standings + tiebreakers ─────────────────────────────────────────────────

describe('computeStandings', () => {
  it('ranks teams by points then assigns 1-based ranks', () => {
    const teams = ['a', 'b', 'c'];
    const results = [
      played('a', 'b', 3, 0), // a:10
      played('a', 'c', 1, 0), // a:8 -> a total 18
      played('b', 'c', 2, 2), // b:5, c:5 — tied; c wins on fewer goals against
    ];
    const table = computeStandings(teams, results, USFA);
    expect(table.map((r) => r.teamId)).toEqual(['a', 'c', 'b']);
    expect(table[0].rank).toBe(1);
    expect(table[0].points).toBe(18);
    expect(table[2].rank).toBe(3);
  });

  it('breaks a two-way tie on head-to-head', () => {
    // a and b both beat c identically; a beat b head-to-head.
    const teams = ['a', 'b', 'c'];
    const results = [
      played('a', 'c', 2, 0),
      played('b', 'c', 2, 0),
      played('a', 'b', 1, 0),
    ];
    const table = computeStandings(teams, results, USFA);
    const [first, second] = table;
    expect(first.teamId).toBe('a');
    expect(second.teamId).toBe('b');
  });

  it('falls to fewest goals against when head-to-head is level', () => {
    // a and b draw head-to-head and have equal points, but b concedes fewer.
    const teams = ['a', 'b', 'c', 'd'];
    const results = [
      played('a', 'b', 1, 1), // h2h level
      played('a', 'c', 1, 0), // a concedes 0 here
      played('a', 'd', 0, 2), // a concedes 2
      played('b', 'c', 1, 0),
      played('b', 'd', 1, 0), // b concedes 0 across the board
    ];
    const table = computeStandings(teams, results, USFA);
    const aRank = table.find((r) => r.teamId === 'a')!.rank;
    const bRank = table.find((r) => r.teamId === 'b')!.rank;
    expect(bRank).toBeLessThan(aRank);
  });

  it('uses recorded penalty kicks to break a drawn-match tie when configured', () => {
    const cfg = resolveTournamentConfig({
      tiebreakers: ['PENALTY_KICKS', 'COIN_TOSS'],
    });
    const teams = ['a', 'b'];
    const results = [
      played('a', 'b', 1, 1, { homePenalties: 5, awayPenalties: 4 }),
    ];
    const table = computeStandings(teams, results, cfg);
    expect(table[0].teamId).toBe('a');
  });

  it('breaks ties on fair play when configured', () => {
    const cfg = resolveTournamentConfig({
      tiebreakers: ['FAIR_PLAY', 'COIN_TOSS'],
    });
    const teams = ['a', 'b', 'c'];
    const results = [
      played('a', 'c', 1, 0),
      played('b', 'c', 1, 0),
      played('a', 'b', 0, 0),
    ];
    const fairPlay = new Map([
      ['a', -2],
      ['b', 0],
      ['c', -1],
    ]);
    const table = computeStandings(teams, results, cfg, fairPlay);
    const aRank = table.find((r) => r.teamId === 'a')!.rank;
    const bRank = table.find((r) => r.teamId === 'b')!.rank;
    expect(bRank).toBeLessThan(aRank);
  });

  it('coin toss is deterministic for a given seed and total', () => {
    const teams = ['x', 'y'];
    const results = [played('x', 'y', 0, 0)]; // identical records, pure tie
    const seedA = resolveTournamentConfig({ randomSeed: 1 });
    const seedAagain = resolveTournamentConfig({ randomSeed: 1 });
    const a1 = computeStandings(teams, results, seedA).map((r) => r.teamId);
    const a2 = computeStandings(teams, results, seedAagain).map(
      (r) => r.teamId,
    );
    expect(a1).toEqual(a2);
  });
});

// ─── Knockout ────────────────────────────────────────────────────────────────

describe('resolveKnockoutMatch', () => {
  it('decides a non-tied match in regulation', () => {
    const res = resolveKnockoutMatch(played('a', 'b', 2, 1), USFA);
    expect(res).toMatchObject({
      winnerId: 'a',
      decidedBy: 'REGULATION',
      resolved: true,
    });
  });

  it('goes to penalties on a tie and picks the higher PK tally', () => {
    const res = resolveKnockoutMatch(
      played('a', 'b', 1, 1, { homePenalties: 4, awayPenalties: 5 }),
      USFA,
    );
    expect(res).toMatchObject({
      winnerId: 'b',
      decidedBy: 'PENALTIES',
      resolved: true,
    });
  });

  it('is unresolved when a tie has no decisive penalties', () => {
    const res = resolveKnockoutMatch(
      played('a', 'b', 1, 1, { homePenalties: 3, awayPenalties: 3 }),
      USFA,
    );
    expect(res.resolved).toBe(false);
  });
});

describe('resolveShootout', () => {
  const T = true;
  const F = false;

  it('decides a completed best-of-5 by total', () => {
    const res = resolveShootout([T, T, T, T, F], [T, T, F, T, F], USFA);
    expect(res).toEqual({ winner: 'HOME', decided: true });
  });

  it('clinches early once the lead is insurmountable', () => {
    // Home scores first 3, away misses first 3 → home can't be caught.
    const res = resolveShootout([T, T, T], [F, F, F], USFA);
    expect(res).toEqual({ winner: 'HOME', decided: true });
  });

  it('continues to sudden death when level after five', () => {
    const res = resolveShootout([T, T, T, T, T], [T, T, T, T, T], USFA);
    expect(res).toEqual({ winner: null, decided: false });
  });

  it('resolves sudden death on a decisive round', () => {
    const res = resolveShootout([T, T, T, T, T, T], [T, T, T, T, T, F], USFA);
    expect(res).toEqual({ winner: 'HOME', decided: true });
  });

  it('stays undecided when sudden-death rounds match', () => {
    const res = resolveShootout([T, T, T, T, T, T], [T, T, T, T, T, T], USFA);
    expect(res).toEqual({ winner: null, decided: false });
  });
});

// ─── Advancement + format ────────────────────────────────────────────────────

describe('advancement', () => {
  it('selects the configured number of advancing teams in rank order', () => {
    const teams = ['a', 'b', 'c', 'd', 'e'];
    const results = [
      played('a', 'b', 3, 0),
      played('a', 'c', 3, 0),
      played('a', 'd', 3, 0),
      played('b', 'c', 2, 0),
      played('c', 'd', 2, 0),
      played('d', 'e', 1, 0),
    ];
    const cfg = resolveTournamentConfig({ advancement: { teamsAdvancing: 2 } });
    const table = computeStandings(teams, results, cfg);
    expect(selectAdvancingTeams(table, cfg)).toEqual([
      table[0].teamId,
      table[1].teamId,
    ]);
  });

  it('derives a power-of-two bracket size from the advancing count', () => {
    expect(resolveBracketSize(USFA, 3)).toBe(4);
    expect(resolveBracketSize(USFA, 4)).toBe(4);
    expect(resolveBracketSize(USFA, 5)).toBe(8);
  });

  it('honors an explicit bracket size override', () => {
    const cfg = resolveTournamentConfig({ advancement: { bracketSize: 16 } });
    expect(resolveBracketSize(cfg, 3)).toBe(16);
  });
});

describe('format phases', () => {
  it('maps each format to its phases', () => {
    expect(phasesForFormat('ROUND_ROBIN')).toEqual(['ROUND_ROBIN']);
    expect(phasesForFormat('KNOCKOUT')).toEqual(['KNOCKOUT']);
    expect(phasesForFormat('ROUND_ROBIN_THEN_KNOCKOUT')).toEqual([
      'ROUND_ROBIN',
      'KNOCKOUT',
    ]);
  });
});

// ─── Config resolution ───────────────────────────────────────────────────────

describe('resolveTournamentConfig', () => {
  it('deep-merges overrides without mutating the base', () => {
    const before = JSON.stringify(USFA_TOURNAMENT_CONFIG);
    const cfg: TournamentConfig = resolveTournamentConfig({
      pointSystem: { win: 4 },
      knockout: { minKicks: 3 },
    });
    expect(cfg.pointSystem.win).toBe(4);
    expect(cfg.pointSystem.draw).toBe(USFA.pointSystem.draw); // untouched
    expect(cfg.knockout.minKicks).toBe(3);
    expect(JSON.stringify(USFA_TOURNAMENT_CONFIG)).toBe(before); // no mutation
  });

  it('replaces arrays wholesale rather than merging', () => {
    const cfg = resolveTournamentConfig({ tiebreakers: ['COIN_TOSS'] });
    expect(cfg.tiebreakers).toEqual(['COIN_TOSS']);
  });
});
