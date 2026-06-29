/**
 * Tournament engine — centralized, configurable rules for standings, knockout
 * resolution, tiebreakers, forfeits, and stage advancement.
 *
 * Everything is driven by {@link TournamentConfig}. The default
 * {@link USFA_TOURNAMENT_CONFIG} encodes the USFA 10-point rule set; build
 * variants with {@link resolveTournamentConfig}. The engine has no Prisma or
 * NestJS dependency — map persisted entities to the plain `MatchResult` /
 * `StandingRow` shapes and back.
 */

export * from './types';
export {
  USFA_POINT_SYSTEM,
  TRADITIONAL_POINT_SYSTEM,
  USFA_TOURNAMENT_CONFIG,
  TRADITIONAL_TOURNAMENT_CONFIG,
  resolveTournamentConfig,
} from './config';
export { pointsFor, scoreMatch, resultFor } from './scoring';
export type { Result, MatchPoints } from './scoring';
export {
  aggregateRows,
  computeStandings,
  computeGroupedStandings,
} from './standings';
export type { GroupedStandingRow, TeamGroupRef } from './standings';
export { orderTiedGroup } from './tiebreakers';
export type { TieContext } from './tiebreakers';
export { resolveKnockoutMatch, resolveShootout } from './knockout';
export type { ShootoutResult, ShootoutSide } from './knockout';
export { normalizeResult, forfeitResult, isAutomaticForfeit } from './forfeit';
export { selectAdvancingTeams, resolveBracketSize } from './advancement';
export { phasesForFormat, hasRoundRobin, hasKnockout } from './format';
export { coinTossOrder, compareCoinToss, seededHash } from './random';
export {
  toTournamentConfig,
  mapPrismaMatchToResult,
  parseTiebreakers,
} from './point-format-mapper';
