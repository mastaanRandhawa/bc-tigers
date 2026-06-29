import { ForbiddenException } from '@nestjs/common';
import {
  assertCoachCanAddGoalEvent,
  assertCoachCanDeleteGoalEvent,
  assertCoachCanUpdateGoalEvent,
} from './coach-match-goals';

jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    match: { findUnique: jest.fn() },
    player: { findFirst: jest.fn() },
  },
}));

jest.mock('../teams/coach-team-link', () => ({
  getCoachTeamId: jest.fn(),
}));

import prisma from '../../prisma/prisma';
import { asMockedPrisma } from '../../test-utils/prisma-mock';
import { getCoachTeamId } from '../teams/coach-team-link';

const mockPrisma = asMockedPrisma(prisma);
const mockGetCoachTeamId = getCoachTeamId as jest.MockedFunction<
  typeof getCoachTeamId
>;

describe('coach-match-goals', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows coach to add a goal for their team', async () => {
    mockGetCoachTeamId.mockResolvedValue('team-home');
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      home_team_id: 'team-home',
      away_team_id: 'team-away',
    });
    mockPrisma.player.findFirst.mockResolvedValue({ id: 'player-1' });

    await expect(
      assertCoachCanAddGoalEvent('coach-1', 'match-1', {
        type: 'GOAL',
        team_id: 'team-home',
        player_id: 'player-1',
      }),
    ).resolves.toBeUndefined();
  });

  it('denies non-goal event types', async () => {
    mockGetCoachTeamId.mockResolvedValue('team-home');
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      home_team_id: 'team-home',
      away_team_id: 'team-away',
    });

    await expect(
      assertCoachCanAddGoalEvent('coach-1', 'match-1', {
        type: 'YELLOW_CARD',
        team_id: 'team-home',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies goals for the opponent team', async () => {
    mockGetCoachTeamId.mockResolvedValue('team-home');
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      home_team_id: 'team-home',
      away_team_id: 'team-away',
    });

    await expect(
      assertCoachCanAddGoalEvent('coach-1', 'match-1', {
        type: 'GOAL',
        team_id: 'team-away',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies editing non-goal events', async () => {
    mockGetCoachTeamId.mockResolvedValue('team-home');
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      home_team_id: 'team-home',
      away_team_id: 'team-away',
    });

    await expect(
      assertCoachCanUpdateGoalEvent(
        'coach-1',
        'match-1',
        { type: 'YELLOW_CARD', team_id: 'team-home' },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies deleting opponent goals', async () => {
    mockGetCoachTeamId.mockResolvedValue('team-home');
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      home_team_id: 'team-home',
      away_team_id: 'team-away',
    });

    await expect(
      assertCoachCanDeleteGoalEvent('coach-1', 'match-1', {
        type: 'GOAL',
        team_id: 'team-away',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
