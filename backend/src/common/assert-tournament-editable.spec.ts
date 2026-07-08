import { BadRequestException } from '@nestjs/common';
import { assertTournamentEditable } from './assert-tournament-editable';

jest.mock('../prisma/prisma', () => ({
  __esModule: true,
  default: {
    tournament: {
      findUnique: jest.fn(),
    },
  },
}));

import prisma from '../prisma/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('assertTournamentEditable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows active tournaments', async () => {
    mockPrisma.tournament.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      admin_editing_enabled: true,
      name: 'Spring Cup',
    } as never);

    await expect(assertTournamentEditable('t-1')).resolves.toBeUndefined();
  });

  it('allows completed tournaments when editing is enabled', async () => {
    mockPrisma.tournament.findUnique.mockResolvedValue({
      status: 'COMPLETED',
      admin_editing_enabled: true,
      name: 'Spring Cup',
    } as never);

    await expect(assertTournamentEditable('t-1')).resolves.toBeUndefined();
  });

  it('blocks completed tournaments in view-only mode', async () => {
    mockPrisma.tournament.findUnique.mockResolvedValue({
      status: 'COMPLETED',
      admin_editing_enabled: false,
      name: 'Spring Cup',
    } as never);

    await expect(assertTournamentEditable('t-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
