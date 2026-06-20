import type {
  KnockoutResolution,
  MatchResult,
  TournamentConfig,
} from './types';

export type ShootoutSide = 'HOME' | 'AWAY';

export interface ShootoutResult {
  winner: ShootoutSide | null;
  /** False when the shootout is still level and more kicks must be taken. */
  decided: boolean;
}

/**
 * Resolve a penalty shootout from the kicks actually taken by each side
 * (`true` = scored). Implements the standard procedure: a best-of-`minKicks`
 * phase that can clinch early once a lead is mathematically insurmountable,
 * followed by sudden-death rounds where a single decisive round wins it.
 *
 * Returns `decided: false` when the supplied kicks do not yet settle the tie,
 * signalling that more kicks are required.
 */
export function resolveShootout(
  home: boolean[],
  away: boolean[],
  config: TournamentConfig,
): ShootoutResult {
  const minK = config.knockout.minKicks;
  let hScore = 0;
  let aScore = 0;

  // ── Best-of-minK phase, kick by kick (home then away each round). ──
  for (let r = 0; r < minK; r++) {
    if (r >= home.length) return { winner: null, decided: false };
    if (home[r]) hScore++;
    // After home's kick: home has (minK-1-r) left, away has (minK-r) left.
    if (hScore > aScore + (minK - r)) return { winner: 'HOME', decided: true };
    if (aScore > hScore + (minK - 1 - r))
      return { winner: 'AWAY', decided: true };

    if (r >= away.length) return { winner: null, decided: false };
    if (away[r]) aScore++;
    // After away's kick both have (minK-1-r) left.
    if (hScore > aScore + (minK - 1 - r))
      return { winner: 'HOME', decided: true };
    if (aScore > hScore + (minK - 1 - r))
      return { winner: 'AWAY', decided: true };
  }

  if (hScore !== aScore) {
    return { winner: hScore > aScore ? 'HOME' : 'AWAY', decided: true };
  }

  if (!config.knockout.suddenDeath) return { winner: null, decided: false };

  // ── Sudden death: both kick each round; a differing round decides it. ──
  for (let r = minK; ; r++) {
    if (r >= home.length || r >= away.length) {
      return { winner: null, decided: false };
    }
    if (home[r] && !away[r]) return { winner: 'HOME', decided: true };
    if (away[r] && !home[r]) return { winner: 'AWAY', decided: true };
  }
}

/**
 * Resolve a single-elimination knockout match.
 *
 * Winner by regulation (or extra time, when the caller has applied it and
 * passed the post-ET scoreline) if the scores differ. Otherwise the tie is
 * settled on penalty kicks using the recorded totals: the side with more
 * successful kicks advances. If totals are missing or level, the match is
 * unresolved (`resolved: false`) and a shootout must be taken/continued.
 */
export function resolveKnockoutMatch(
  match: MatchResult,
  config: TournamentConfig,
): KnockoutResolution {
  const { homeTeamId, awayTeamId, homeScore, awayScore } = match;

  if (homeScore !== awayScore) {
    const homeWon = homeScore > awayScore;
    return {
      winnerId: homeWon ? homeTeamId : awayTeamId,
      loserId: homeWon ? awayTeamId : homeTeamId,
      decidedBy: config.knockout.useExtraTime ? 'EXTRA_TIME' : 'REGULATION',
      resolved: true,
    };
  }

  const hp = match.homePenalties;
  const ap = match.awayPenalties;
  if (hp == null || ap == null || hp === ap) {
    return {
      winnerId: null,
      loserId: null,
      decidedBy: 'PENALTIES',
      resolved: false,
    };
  }

  const homeWon = hp > ap;
  return {
    winnerId: homeWon ? homeTeamId : awayTeamId,
    loserId: homeWon ? awayTeamId : homeTeamId,
    decidedBy: 'PENALTIES',
    resolved: true,
  };
}
