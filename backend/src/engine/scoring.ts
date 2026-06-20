import type { MatchResult, PointSystemConfig, TournamentConfig } from './types';
import { normalizeResult } from './forfeit';

export type Result = 'WIN' | 'DRAW' | 'LOSS';

export function resultFor(goalsFor: number, goalsAgainst: number): Result {
  if (goalsFor > goalsAgainst) return 'WIN';
  if (goalsFor < goalsAgainst) return 'LOSS';
  return 'DRAW';
}

/**
 * Points earned by one team in a single match under the given point system.
 *
 * Bonuses (when enabled): +shutout for a clean sheet, +per-goal for each goal
 * scored up to the cap. Bonuses on a loss are gated by `applyBonusesOnLoss`.
 *
 * Worked USFA examples — 3-0:10, 2-0:9, 4-2:9, 0-0 draw:4, 2-2 draw:5.
 */
export function pointsFor(
  goalsFor: number,
  goalsAgainst: number,
  pointSystem: PointSystemConfig,
): number {
  const result = resultFor(goalsFor, goalsAgainst);
  const base =
    result === 'WIN'
      ? pointSystem.win
      : result === 'DRAW'
        ? pointSystem.draw
        : pointSystem.loss;

  if (!pointSystem.bonusesEnabled) return base;
  if (result === 'LOSS' && !pointSystem.applyBonusesOnLoss) return base;

  const shutout = goalsAgainst === 0 ? pointSystem.shutoutBonus : 0;
  const goalBonus =
    Math.min(goalsFor, pointSystem.goalBonusCap) * pointSystem.goalBonusPerGoal;

  return base + shutout + goalBonus;
}

export interface MatchPoints {
  home: number;
  away: number;
}

/**
 * Points awarded to both teams for a completed match, honoring forfeit rules.
 *
 * A forfeit is first normalized to its recorded scoreline (e.g. 2-0). If the
 * config does not award bonuses on forfeits, the winner gets a flat win and the
 * loser a flat loss; otherwise the recorded scoreline is scored normally.
 */
export function scoreMatch(
  match: MatchResult,
  config: TournamentConfig,
): MatchPoints {
  const norm = normalizeResult(match, config);

  if (norm.outcome === 'FORFEIT' && !config.forfeit.awardBonuses) {
    const homeWon = norm.homeScore > norm.awayScore;
    return {
      home: homeWon ? config.pointSystem.win : config.pointSystem.loss,
      away: homeWon ? config.pointSystem.loss : config.pointSystem.win,
    };
  }

  return {
    home: pointsFor(norm.homeScore, norm.awayScore, config.pointSystem),
    away: pointsFor(norm.awayScore, norm.homeScore, config.pointSystem),
  };
}
