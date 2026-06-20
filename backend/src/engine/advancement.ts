import type { StandingRow, TournamentConfig } from './types';

/** Smallest power of two >= n (minimum 2). Mirrors the bracket scheduler. */
function nextPowerOfTwo(n: number): number {
  if (n <= 2) return 2;
  let size = 2;
  while (size < n) size *= 2;
  return size;
}

/**
 * Team ids that advance from a round-robin standings table into the knockout
 * stage, taking the top `advancement.teamsAdvancing` by rank. `standings` is
 * expected to be already ranked (as returned by `computeStandings`).
 */
export function selectAdvancingTeams(
  standings: StandingRow[],
  config: TournamentConfig,
): string[] {
  const count = Math.min(config.advancement.teamsAdvancing, standings.length);
  return [...standings]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, count)
    .map((row) => row.teamId);
}

/**
 * Knockout bracket size to use. Honors an explicit `advancement.bracketSize`
 * when set (> 0); otherwise rounds the advancing-team count up to a power of
 * two (byes fill the remainder).
 */
export function resolveBracketSize(
  config: TournamentConfig,
  advancingCount: number,
): number {
  if (config.advancement.bracketSize > 0) return config.advancement.bracketSize;
  return nextPowerOfTwo(Math.max(advancingCount, 2));
}
