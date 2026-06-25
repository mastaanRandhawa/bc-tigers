import { BadRequestException } from '@nestjs/common';

jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    team: { findUnique: jest.fn() },
    player: { count: jest.fn(), create: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('../settings/settings.service', () => ({
  getMaxPlayersPerTeam: jest.fn().mockResolvedValue(25),
}));

jest.mock('../auth/roster-visibility', () => ({
  getRosterVisibilityContext: jest.fn(),
  canViewTeamRoster: jest.fn(),
  isAdminRole: jest.fn(),
}));

jest.mock('../../common/player-slug', () => ({
  slugifyPlayerName: jest.fn(() => 'john-doe'),
  ensureUniquePlayerSlug: jest.fn(async () => 'john-doe'),
}));

import prisma from '../../prisma/prisma';
import { getRosterVisibilityContext } from '../auth/roster-visibility';
import { TeamPlayersService } from './team-players.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetRosterVisibilityContext =
  getRosterVisibilityContext as jest.MockedFunction<
    typeof getRosterVisibilityContext
  >;

describe('TeamPlayersService roster cap', () => {
  const service = new TeamPlayersService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRosterVisibilityContext.mockResolvedValue({
      rostersPublic: true,
      actor: undefined,
    });
  });

  it('returns empty roster for public viewers before publish', async () => {
    mockPrisma.team.findUnique.mockResolvedValue({
      id: 'team-1',
      coach_user_id: 'coach-1',
    } as never);
    mockGetRosterVisibilityContext.mockResolvedValue({
      rostersPublic: false,
      actor: undefined,
    });

    await expect(service.findByTeam('team-1')).resolves.toEqual([]);
    expect(mockPrisma.player.findMany).not.toHaveBeenCalled();
  });

  it('rejects create when roster is at capacity', async () => {
    mockPrisma.team.findUnique.mockResolvedValue({ id: 'team-1' });
    mockPrisma.player.count.mockResolvedValue(25);

    await expect(
      service.create('team-1', { first_name: 'John', last_name: 'Doe' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows create when below capacity', async () => {
    mockPrisma.team.findUnique.mockResolvedValue({ id: 'team-1' });
    mockPrisma.player.count.mockResolvedValue(24);
    mockPrisma.player.create.mockResolvedValue({ id: 'p1' });

    await expect(
      service.create('team-1', { first_name: 'John', last_name: 'Doe' }),
    ).resolves.toEqual({ id: 'p1' });
  });
});
