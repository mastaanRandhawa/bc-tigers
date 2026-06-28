import type { PointFormat } from '@prisma/client';
import type { MatchResult, TiebreakerRule, TournamentConfig } from './types';
import { USFA_TOURNAMENT_CONFIG } from './config';

const DEFAULT_TIEBREAKERS: TiebreakerRule[] = [
  'GOAL_DIFFERENCE',
  'GOALS_FOR',
  'HEAD_TO_HEAD',
  'COIN_TOSS',
];

export function parseTiebreakers(value: unknown): TiebreakerRule[] {
  if (!Array.isArray(value)) return DEFAULT_TIEBREAKERS;
  const allowed = new Set<string>([
    'HEAD_TO_HEAD',
    'GOALS_AGAINST',
    'GOALS_FOR',
    'GOAL_DIFFERENCE',
    'WINS',
    'PENALTY_KICKS',
    'COIN_TOSS',
  ]);
  const parsed = value.filter(
    (v): v is TiebreakerRule => typeof v === 'string' && allowed.has(v),
  );
  return parsed.length > 0 ? parsed : DEFAULT_TIEBREAKERS;
}

export function toTournamentConfig(pointFormat: PointFormat): TournamentConfig {
  return {
    ...USFA_TOURNAMENT_CONFIG,
    pointSystem: {
      win: pointFormat.win,
      draw: pointFormat.draw,
      loss: pointFormat.loss,
      bonusesEnabled: pointFormat.bonuses_enabled,
      shutoutBonus: pointFormat.shutout_bonus,
      goalBonusPerGoal: pointFormat.goal_bonus_per_goal,
      goalBonusCap: pointFormat.goal_bonus_cap,
      applyBonusesOnLoss: pointFormat.apply_bonuses_on_loss,
    },
    forfeit: {
      winScore: pointFormat.forfeit_win_score,
      lossScore: pointFormat.forfeit_loss_score,
      awardBonuses: pointFormat.forfeit_award_bonuses,
      lateThresholdMinutes: USFA_TOURNAMENT_CONFIG.forfeit.lateThresholdMinutes,
    },
    tiebreakers: parseTiebreakers(pointFormat.tiebreakers),
  };
}

type PrismaMatchLike = {
  // Nullable for placeholder fixtures, but a COMPLETED match always has both
  // teams (the only matches passed here), so the coalesce below never triggers.
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number;
  away_score: number;
};

export function mapPrismaMatchToResult(match: PrismaMatchLike): MatchResult {
  return {
    homeTeamId: match.home_team_id ?? '',
    awayTeamId: match.away_team_id ?? '',
    homeScore: match.home_score,
    awayScore: match.away_score,
    outcome: 'PLAYED',
  };
}
