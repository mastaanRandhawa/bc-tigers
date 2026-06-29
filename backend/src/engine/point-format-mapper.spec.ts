import {
  toTournamentConfig,
  mapPrismaMatchToResult,
  parseTiebreakers,
} from './point-format-mapper';
import {
  USFA_TOURNAMENT_CONFIG,
  TRADITIONAL_TOURNAMENT_CONFIG,
} from './config';
import type { PointFormat } from '@prisma/client';

function formatRow(overrides: Partial<PointFormat>): PointFormat {
  return {
    id: 'pf-test',
    name: 'Test Format',
    slug: 'test-format',
    description: null,
    is_system: false,
    win: 3,
    draw: 1,
    loss: 0,
    bonuses_enabled: false,
    shutout_bonus: 0,
    goal_bonus_per_goal: 0,
    goal_bonus_cap: 0,
    apply_bonuses_on_loss: false,
    forfeit_win_score: 2,
    forfeit_loss_score: 0,
    forfeit_award_bonuses: false,
    tiebreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD', 'COIN_TOSS'],
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('point-format-mapper', () => {
  it('maps Standard Soccer row to traditional tournament config', () => {
    const row = formatRow({
      name: 'Standard Soccer (3 Point System)',
      slug: 'standard-soccer-3-point',
      win: 3,
      draw: 1,
      loss: 0,
      bonuses_enabled: false,
      forfeit_award_bonuses: false,
      tiebreakers: [
        'GOAL_DIFFERENCE',
        'GOALS_FOR',
        'HEAD_TO_HEAD',
        'FAIR_PLAY',
        'COIN_TOSS',
      ],
    });
    const cfg = toTournamentConfig(row);
    expect(cfg.pointSystem).toEqual(TRADITIONAL_TOURNAMENT_CONFIG.pointSystem);
    expect(cfg.forfeit).toMatchObject({
      winScore: 2,
      lossScore: 0,
      awardBonuses: false,
    });
    expect(cfg.tiebreakers).toEqual([
      'GOAL_DIFFERENCE',
      'GOALS_FOR',
      'HEAD_TO_HEAD',
      'COIN_TOSS',
    ]);
  });

  it('maps USFA row to USFA point system and tiebreakers', () => {
    const row = formatRow({
      name: 'USFA 10-Point System',
      slug: 'usfa-10-point',
      win: 6,
      draw: 3,
      loss: 0,
      bonuses_enabled: true,
      shutout_bonus: 1,
      goal_bonus_per_goal: 1,
      goal_bonus_cap: 3,
      apply_bonuses_on_loss: true,
      forfeit_award_bonuses: true,
      tiebreakers: ['HEAD_TO_HEAD', 'GOALS_AGAINST', 'GOALS_FOR', 'COIN_TOSS'],
    });
    const cfg = toTournamentConfig(row);
    expect(cfg.pointSystem).toEqual(USFA_TOURNAMENT_CONFIG.pointSystem);
    expect(cfg.tiebreakers).toEqual([
      'HEAD_TO_HEAD',
      'GOALS_AGAINST',
      'GOALS_FOR',
      'COIN_TOSS',
    ]);
  });

  it('maps prisma matches to PLAYED engine results', () => {
    expect(
      mapPrismaMatchToResult({
        home_team_id: 'h1',
        away_team_id: 'a1',
        home_score: 3,
        away_score: 0,
      }),
    ).toEqual({
      homeTeamId: 'h1',
      awayTeamId: 'a1',
      homeScore: 3,
      awayScore: 0,
      outcome: 'PLAYED',
    });
  });

  it('falls back to default tiebreakers for invalid JSON', () => {
    expect(parseTiebreakers(null)).toContain('COIN_TOSS');
    expect(parseTiebreakers(['INVALID'])).toContain('COIN_TOSS');
    expect(parseTiebreakers(['FAIR_PLAY', 'COIN_TOSS'])).toEqual(['COIN_TOSS']);
  });
});
