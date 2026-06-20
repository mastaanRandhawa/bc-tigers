import type { DeepPartial, PointSystemConfig, TournamentConfig } from './types';

/**
 * USFA default 10-point system.
 *
 *   win 6 / draw 3 / loss 0
 *   +1 shutout (clean sheet)
 *   +1 per goal scored, capped at 3
 *
 *   3-0 win = 10 · 2-0 win = 9 · 4-2 win = 9 · 0-0 draw = 4 · 2-2 draw = 5
 */
export const USFA_POINT_SYSTEM: PointSystemConfig = {
  win: 6,
  draw: 3,
  loss: 0,
  bonusesEnabled: true,
  shutoutBonus: 1,
  goalBonusPerGoal: 1,
  goalBonusCap: 3,
  applyBonusesOnLoss: true,
};

/** Traditional 3-point league system: win 3 / draw 1 / loss 0, no bonuses. */
export const TRADITIONAL_POINT_SYSTEM: PointSystemConfig = {
  win: 3,
  draw: 1,
  loss: 0,
  bonusesEnabled: false,
  shutoutBonus: 0,
  goalBonusPerGoal: 0,
  goalBonusCap: 0,
  applyBonusesOnLoss: false,
};

/**
 * Full USFA tournament configuration — the engine's default rule set.
 * Every field is overridable via {@link resolveTournamentConfig}.
 */
export const USFA_TOURNAMENT_CONFIG: TournamentConfig = {
  format: 'ROUND_ROBIN_THEN_KNOCKOUT',
  pointSystem: USFA_POINT_SYSTEM,
  tiebreakers: ['HEAD_TO_HEAD', 'GOALS_AGAINST', 'GOALS_FOR', 'COIN_TOSS'],
  knockout: {
    useExtraTime: false, // USFA skips extra time, straight to kicks
    minKicks: 5,
    suddenDeath: true,
  },
  forfeit: {
    winScore: 2,
    lossScore: 0,
    awardBonuses: true,
    lateThresholdMinutes: 10,
  },
  advancement: {
    teamsAdvancing: 4,
    bracketSize: 0, // derive from advancing team count
  },
  randomSeed: 1,
};

/** Convenience preset: same as USFA but using the traditional 3-point system. */
export const TRADITIONAL_TOURNAMENT_CONFIG: TournamentConfig = {
  ...USFA_TOURNAMENT_CONFIG,
  pointSystem: TRADITIONAL_POINT_SYSTEM,
  tiebreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD', 'COIN_TOSS'],
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep-merge `override` onto `base`, replacing arrays wholesale. */
function deepMerge<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (override === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override as unknown as T) ?? base;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const current = (base as Record<string, unknown>)[key];
    out[key] =
      isPlainObject(current) && isPlainObject(value)
        ? deepMerge(current, value as DeepPartial<unknown>)
        : value;
  }
  return out as T;
}

/**
 * Build a complete {@link TournamentConfig} from a partial override on top of a
 * base (USFA by default). Arrays such as `tiebreakers` are replaced, not merged.
 */
export function resolveTournamentConfig(
  override?: DeepPartial<TournamentConfig>,
  base: TournamentConfig = USFA_TOURNAMENT_CONFIG,
): TournamentConfig {
  return deepMerge(base, override);
}
