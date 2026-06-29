jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    match: { findMany: jest.fn() },
    division: { findUniqueOrThrow: jest.fn() },
    team: { findMany: jest.fn() },
    teamDivision: { findMany: jest.fn() },
    standing: { upsert: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) =>
      Promise.all(ops as Promise<unknown>[]),
    ),
  },
}));

import prisma from '../../prisma/prisma';
import { asMockedPrisma } from '../../test-utils/prisma-mock';
import { StandingsService } from './standings.service';

const mockPrisma = asMockedPrisma(prisma);

const standardFormat = {
  id: 'pf-standard',
  name: 'Standard Soccer (3 Point System)',
  slug: 'standard-soccer-3-point',
  description: null,
  is_system: true,
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
};

const usfaFormat = {
  ...standardFormat,
  id: 'pf-usfa',
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
};

describe('StandingsService', () => {
  const service = new StandingsService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.teamDivision.findMany.mockResolvedValue([
      { team_id: 'home', group_id: null },
      { team_id: 'away', group_id: null },
    ] as never);
    mockPrisma.match.findMany.mockResolvedValue([
      {
        home_team_id: 'home',
        away_team_id: 'away',
        home_score: 3,
        away_score: 0,
      },
    ] as never);
    mockPrisma.standing.upsert.mockResolvedValue({});
    mockPrisma.standing.findMany = jest.fn().mockResolvedValue([]);
  });

  it('awards 3 points for a 3-0 win under Standard Soccer', async () => {
    mockPrisma.division.findUniqueOrThrow.mockResolvedValue({
      id: 'div-1',
      point_format: standardFormat,
    });

    await service.recalculate('div-1');

    const homeUpsert = mockPrisma.standing.upsert.mock.calls.find(
      ([args]) => args.create.team_id === 'home',
    );
    expect(homeUpsert?.[0].create.points).toBe(3);
  });

  it('awards 10 points for a 3-0 win under USFA', async () => {
    mockPrisma.division.findUniqueOrThrow.mockResolvedValue({
      id: 'div-1',
      point_format: usfaFormat,
    });

    await service.recalculate('div-1');

    const homeUpsert = mockPrisma.standing.upsert.mock.calls.find(
      ([args]) => args.create.team_id === 'home',
    );
    expect(homeUpsert?.[0].create.points).toBe(10);
  });
});
