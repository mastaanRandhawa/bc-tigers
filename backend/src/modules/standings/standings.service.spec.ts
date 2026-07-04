jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    match: { findMany: jest.fn() },
    division: { findUniqueOrThrow: jest.fn() },
    team: { findMany: jest.fn() },
    teamDivision: { findMany: jest.fn() },
    standing: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    bracketNode: { findMany: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) =>
      Promise.all(ops as Promise<unknown>[]),
    ),
  },
}));

jest.mock('../matches/match-outcome', () => {
  const actual =
    jest.requireActual<typeof import('../matches/match-outcome')>(
      '../matches/match-outcome',
    );
  return {
    ...actual,
    standingsExcludedMatchIdsForDivision: jest.fn().mockResolvedValue(new Set()),
  };
});

import prisma from '../../prisma/prisma';
import { asMockedPrisma } from '../../test-utils/prisma-mock';
import { StandingsService } from './standings.service';
import { standingsExcludedMatchIdsForDivision } from '../matches/match-outcome';

const mockPrisma = asMockedPrisma(prisma);
const mockExcludedIds = standingsExcludedMatchIdsForDivision as jest.MockedFunction<
  typeof standingsExcludedMatchIdsForDivision
>;

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
    mockExcludedIds.mockResolvedValue(new Set());
    mockPrisma.teamDivision.findMany.mockResolvedValue([
      { team_id: 'home', group_id: null },
      { team_id: 'away', group_id: null },
    ] as never);
    mockPrisma.standing.upsert.mockResolvedValue({});
    mockPrisma.standing.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.standing.findMany = jest.fn().mockResolvedValue([]);
  });

  it('awards 1 point each for a 0–0 round-robin draw under Standard Soccer', async () => {
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'league-1',
        home_team_id: 'home',
        away_team_id: 'away',
        home_score: 0,
        away_score: 0,
        home_penalties: null,
        away_penalties: null,
      },
    ] as never);
    mockPrisma.division.findUniqueOrThrow.mockResolvedValue({
      id: 'div-1',
      groups_enabled: false,
      point_format: standardFormat,
    });

    await service.recalculate('div-1');

    const homeUpsert = mockPrisma.standing.upsert.mock.calls.find(
      ([args]) => args.create.team_id === 'home',
    );
    const awayUpsert = mockPrisma.standing.upsert.mock.calls.find(
      ([args]) => args.create.team_id === 'away',
    );
    expect(homeUpsert?.[0].create.points).toBe(1);
    expect(homeUpsert?.[0].create.draws).toBe(1);
    expect(awayUpsert?.[0].create.points).toBe(1);
  });

  it('excludes elimination matches from standings', async () => {
    mockExcludedIds.mockResolvedValue(new Set(['ko-1']));
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'ko-1',
        home_team_id: 'home',
        away_team_id: 'away',
        home_score: 2,
        away_score: 2,
        home_penalties: 5,
        away_penalties: 4,
      },
    ] as never);
    mockPrisma.division.findUniqueOrThrow.mockResolvedValue({
      id: 'div-1',
      groups_enabled: false,
      point_format: standardFormat,
    });

    await service.recalculate('div-1');

    const homeUpsert = mockPrisma.standing.upsert.mock.calls.find(
      ([args]) => args.create.team_id === 'home',
    );
    expect(homeUpsert?.[0].create.points).toBe(0);
    expect(homeUpsert?.[0].create.draws).toBe(0);
    expect(homeUpsert?.[0].create.played).toBe(0);
  });

  it('counts pool matches for grouped divisions even when knockout placeholders exist', async () => {
    mockExcludedIds.mockResolvedValue(new Set());
    mockPrisma.teamDivision.findMany.mockResolvedValue([
      { team_id: 'home', group_id: 'pool-a' },
      { team_id: 'away', group_id: 'pool-a' },
    ] as never);
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'pool-1',
        home_team_id: 'home',
        away_team_id: 'away',
        home_score: 2,
        away_score: 1,
        home_penalties: null,
        away_penalties: null,
      },
    ] as never);
    mockPrisma.division.findUniqueOrThrow.mockResolvedValue({
      id: 'div-1',
      groups_enabled: true,
      point_format: standardFormat,
    });

    await service.recalculate('div-1');

    const homeUpsert = mockPrisma.standing.upsert.mock.calls.find(
      ([args]) => args.create.team_id === 'home',
    );
    expect(homeUpsert?.[0].create.group_id).toBe('pool-a');
    expect(homeUpsert?.[0].create.points).toBe(3);
    expect(homeUpsert?.[0].create.played).toBe(1);
  });

  it('excludes bracket knockout fixtures from grouped standings', async () => {
    mockExcludedIds.mockResolvedValue(new Set(['ko-1']));
    mockPrisma.teamDivision.findMany.mockResolvedValue([
      { team_id: 'home', group_id: 'pool-a' },
      { team_id: 'away', group_id: 'pool-a' },
    ] as never);
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'pool-1',
        home_team_id: 'home',
        away_team_id: 'away',
        home_score: 2,
        away_score: 1,
        home_penalties: null,
        away_penalties: null,
      },
      {
        id: 'ko-1',
        home_team_id: 'home',
        away_team_id: 'away',
        home_score: 1,
        away_score: 0,
        home_penalties: null,
        away_penalties: null,
      },
    ] as never);
    mockPrisma.division.findUniqueOrThrow.mockResolvedValue({
      id: 'div-1',
      groups_enabled: true,
      point_format: standardFormat,
    });

    await service.recalculate('div-1');

    const homeUpsert = mockPrisma.standing.upsert.mock.calls.find(
      ([args]) => args.create.team_id === 'home',
    );
    expect(homeUpsert?.[0].create.points).toBe(3);
    expect(homeUpsert?.[0].create.played).toBe(1);
  });

  it('awards 3 points for a 3-0 win under Standard Soccer', async () => {
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'league-1',
        home_team_id: 'home',
        away_team_id: 'away',
        home_score: 3,
        away_score: 0,
        home_penalties: null,
        away_penalties: null,
      },
    ] as never);
    mockPrisma.division.findUniqueOrThrow.mockResolvedValue({
      id: 'div-1',
      groups_enabled: false,
      point_format: standardFormat,
    });

    await service.recalculate('div-1');

    const homeUpsert = mockPrisma.standing.upsert.mock.calls.find(
      ([args]) => args.create.team_id === 'home',
    );
    expect(homeUpsert?.[0].create.points).toBe(3);
  });

  it('ignores stale penalty totals when tie_resolution is DRAW', async () => {
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'league-1',
        home_team_id: 'home',
        away_team_id: 'away',
        home_score: 1,
        away_score: 1,
        home_penalties: 5,
        away_penalties: 4,
        tie_resolution: 'DRAW',
      },
    ] as never);
    mockPrisma.division.findUniqueOrThrow.mockResolvedValue({
      id: 'div-1',
      groups_enabled: false,
      point_format: {
        ...standardFormat,
        tiebreakers: ['PENALTY_KICKS', 'COIN_TOSS'],
      },
    });

    await service.recalculate('div-1');

    const homeUpsert = mockPrisma.standing.upsert.mock.calls.find(
      ([args]) => args.create.team_id === 'home',
    );
    expect(homeUpsert?.[0].create.points).toBe(1);
    expect(homeUpsert?.[0].create.draws).toBe(1);
  });

  it('removes stale standing rows on recalculate', async () => {
    mockPrisma.teamDivision.findMany.mockResolvedValue([
      { team_id: 'home', group_id: null },
    ] as never);
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'league-1',
        home_team_id: 'home',
        away_team_id: 'away',
        home_score: 1,
        away_score: 0,
        home_penalties: null,
        away_penalties: null,
        tie_resolution: null,
      },
    ] as never);
    mockPrisma.division.findUniqueOrThrow.mockResolvedValue({
      id: 'div-1',
      groups_enabled: false,
      point_format: standardFormat,
    });

    await service.recalculate('div-1');

    expect(mockPrisma.standing.deleteMany).toHaveBeenCalledWith({
      where: {
        division_id: 'div-1',
        team_id: { notIn: ['home', 'away'] },
      },
    });
  });

  it('awards 10 points for a 3-0 win under USFA', async () => {
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'league-1',
        home_team_id: 'home',
        away_team_id: 'away',
        home_score: 3,
        away_score: 0,
        home_penalties: null,
        away_penalties: null,
      },
    ] as never);
    mockPrisma.division.findUniqueOrThrow.mockResolvedValue({
      id: 'div-1',
      groups_enabled: false,
      point_format: usfaFormat,
    });

    await service.recalculate('div-1');

    const homeUpsert = mockPrisma.standing.upsert.mock.calls.find(
      ([args]) => args.create.team_id === 'home',
    );
    expect(homeUpsert?.[0].create.points).toBe(10);
  });
});
