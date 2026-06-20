import type { MatchResult, TournamentConfig } from './types';

/**
 * Produce the recorded scoreline for a forfeit. Per USFA, a forfeit is
 * recorded as a `winScore`-`lossScore` (default 2-0) win for the team that did
 * not forfeit. Played matches are returned unchanged.
 */
export function normalizeResult(
  match: MatchResult,
  config: TournamentConfig,
): MatchResult {
  if (match.outcome !== 'FORFEIT' || !match.forfeitedBy) return match;

  const { winScore, lossScore } = config.forfeit;
  const homeForfeited = match.forfeitedBy === match.homeTeamId;

  return {
    ...match,
    homeScore: homeForfeited ? lossScore : winScore,
    awayScore: homeForfeited ? winScore : lossScore,
    // A forfeit is never decided on kicks.
    homePenalties: null,
    awayPenalties: null,
  };
}

/**
 * Build a forfeit {@link MatchResult}. The forfeiting team is recorded with the
 * loss scoreline; the opponent takes the win.
 */
export function forfeitResult(
  homeTeamId: string,
  awayTeamId: string,
  forfeitedBy: string,
  config: TournamentConfig,
): MatchResult {
  const { winScore, lossScore } = config.forfeit;
  const homeForfeited = forfeitedBy === homeTeamId;
  return {
    homeTeamId,
    awayTeamId,
    homeScore: homeForfeited ? lossScore : winScore,
    awayScore: homeForfeited ? winScore : lossScore,
    outcome: 'FORFEIT',
    forfeitedBy,
  };
}

/**
 * Whether a team arriving `minutesLate` triggers an automatic forfeit. USFA:
 * more than 10 minutes late forfeits (recorded as a 2-0 loss).
 */
export function isAutomaticForfeit(
  minutesLate: number,
  config: TournamentConfig,
): boolean {
  return minutesLate > config.forfeit.lateThresholdMinutes;
}
