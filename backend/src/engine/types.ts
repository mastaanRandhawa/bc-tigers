/**
 * Tournament engine types.
 *
 * The engine is intentionally framework-agnostic: it knows nothing about Prisma,
 * NestJS, or the database. Callers map their persisted entities to these plain
 * shapes, run the engine, and map the results back. Every rule is driven by
 * {@link TournamentConfig} so a single engine can serve multiple rule sets
 * (USFA 10-point, traditional 3-point, custom) without code changes.
 */

// ─── Formats ─────────────────────────────────────────────────────────────────

export type TournamentFormat =
  | 'ROUND_ROBIN'
  | 'KNOCKOUT'
  | 'ROUND_ROBIN_THEN_KNOCKOUT';

/** A phase the tournament moves through, derived from the format. */
export type TournamentPhase = 'ROUND_ROBIN' | 'KNOCKOUT';

// ─── Point system ────────────────────────────────────────────────────────────

/**
 * How a single match result converts to standings points.
 *
 * USFA 10-point default: win 6 / draw 3 / loss 0, +1 shutout (clean sheet),
 * +1 per goal scored capped at 3. Disable {@link bonusesEnabled} for the
 * traditional 3-point system (win 3 / draw 1 / loss 0, no bonuses).
 */
export interface PointSystemConfig {
  win: number;
  draw: number;
  loss: number;
  /** Master switch for the USFA-style bonus points. */
  bonusesEnabled: boolean;
  /** Points added when a team concedes zero goals (clean sheet). */
  shutoutBonus: number;
  /** Points added per goal scored, before the cap. */
  goalBonusPerGoal: number;
  /** Maximum number of goals that earn the per-goal bonus. */
  goalBonusCap: number;
  /**
   * Whether bonus points (shutout + goals) are also awarded to a team that
   * loses the match. The USFA system awards goal/shutout bonuses regardless of
   * result, so this defaults to `true`. Set `false` for rule sets that only
   * grant bonuses to the winner or in a draw.
   */
  applyBonusesOnLoss: boolean;
}

// ─── Forfeits ────────────────────────────────────────────────────────────────

export interface ForfeitConfig {
  /** Goals credited to the team that did NOT forfeit. USFA: 2. */
  winScore: number;
  /** Goals credited to the forfeiting team. USFA: 0. */
  lossScore: number;
  /**
   * Whether the recorded forfeit scoreline runs through the normal point
   * system (so a 2-0 forfeit earns the same as a played 2-0). When `false`,
   * the winner receives a flat {@link PointSystemConfig.win} with no bonuses.
   */
  awardBonuses: boolean;
  /** Minutes after kickoff past which a missing team automatically forfeits. */
  lateThresholdMinutes: number;
}

// ─── Tiebreakers ─────────────────────────────────────────────────────────────

export type TiebreakerRule =
  | 'HEAD_TO_HEAD' // points earned only in matches among the tied teams
  | 'GOALS_AGAINST' // fewest conceded wins
  | 'GOALS_FOR' // most scored wins
  | 'GOAL_DIFFERENCE'
  | 'WINS'
  | 'FAIR_PLAY' // discipline score from cards (higher is better)
  | 'PENALTY_KICKS' // PKs taken after a drawn round-robin match
  | 'COIN_TOSS'; // deterministic random fallback

// ─── Knockout ────────────────────────────────────────────────────────────────

export interface KnockoutConfig {
  /** USFA skips extra time and goes straight to kicks. */
  useExtraTime: boolean;
  /** Minimum kicks each team takes before sudden death (USFA: 5). */
  minKicks: number;
  /** Continue one-for-one until a winner emerges. */
  suddenDeath: boolean;
}

// ─── Advancement ─────────────────────────────────────────────────────────────

export interface AdvancementConfig {
  /** How many teams advance out of a round-robin (group) standings table. */
  teamsAdvancing: number;
  /** Target knockout bracket size; 0 = derive from the advancing team count. */
  bracketSize: number;
}

// ─── Top-level config ────────────────────────────────────────────────────────

export interface TournamentConfig {
  format: TournamentFormat;
  pointSystem: PointSystemConfig;
  /** Tiebreakers applied in order until the tie is broken. */
  tiebreakers: TiebreakerRule[];
  knockout: KnockoutConfig;
  forfeit: ForfeitConfig;
  advancement: AdvancementConfig;
  /** Seed for deterministic coin-toss / random selection. */
  randomSeed: number;
}

/** Recursive partial used by {@link resolveTournamentConfig}. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// ─── Match results (engine input) ────────────────────────────────────────────

export type MatchOutcome = 'PLAYED' | 'FORFEIT';

/**
 * A completed match as the engine consumes it. Scores are the regulation
 * scoreline. For knockout ties decided on kicks, populate the penalty fields.
 */
export interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  outcome: MatchOutcome;
  /** Team id that forfeited, when `outcome === 'FORFEIT'`. */
  forfeitedBy?: string | null;
  /** Successful penalty kicks, when a tie was settled on PKs. */
  homePenalties?: number | null;
  awayPenalties?: number | null;
}

// ─── Standings (engine output) ───────────────────────────────────────────────

export interface StandingRow {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** 1-based finishing position after tiebreakers. */
  rank: number;
}

// ─── Knockout resolution (engine output) ─────────────────────────────────────

export type DecidedBy = 'REGULATION' | 'EXTRA_TIME' | 'PENALTIES';

export interface KnockoutResolution {
  winnerId: string | null;
  loserId: string | null;
  decidedBy: DecidedBy;
  /** False when a shootout is still level and more kicks are required. */
  resolved: boolean;
}
