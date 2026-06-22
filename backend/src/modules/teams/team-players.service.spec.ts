import { BadRequestException } from '@nestjs/common';

jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    team: { findUnique: jest.fn() },
    player: { count: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('../settings/settings.service', () => ({
  getMaxPlayersPerTeam: jest.fn().mockResolvedValue(25),
}));

jest.mock('../../common/player-slug', () => ({
  slugifyPlayerName: jest.fn(() => 'john-doe'),
  ensureUniquePlayerSlug: jest.fn(async () => 'john-doe'),
}));

import prisma from '../../prisma/prisma';
import { TeamPlayersService } from './team-players.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('TeamPlayersService roster cap', () => {
  const service = new TeamPlayersService();

  beforeEach(() => jest.clearAllMocks());

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
