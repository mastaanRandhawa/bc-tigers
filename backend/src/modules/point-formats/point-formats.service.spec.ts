import { ConflictException, NotFoundException } from '@nestjs/common';

jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    pointFormat: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import prisma from '../../prisma/prisma';
import { asMockedPrisma } from '../../test-utils/prisma-mock';
import { PointFormatsService } from './point-formats.service';

const mockPrisma = asMockedPrisma(prisma);

describe('PointFormatsService', () => {
  const service = new PointFormatsService();

  beforeEach(() => jest.clearAllMocks());

  it('blocks delete when divisions are assigned', async () => {
    mockPrisma.pointFormat.findUnique.mockResolvedValue({
      id: 'pf-1',
      _count: { divisions: 2 },
    });

    await expect(service.remove('pf-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(mockPrisma.pointFormat.delete).not.toHaveBeenCalled();
  });

  it('allows delete when no divisions are assigned', async () => {
    mockPrisma.pointFormat.findUnique.mockResolvedValue({
      id: 'pf-1',
      _count: { divisions: 0 },
    });
    mockPrisma.pointFormat.delete.mockResolvedValue({ id: 'pf-1' });

    await expect(service.remove('pf-1')).resolves.toEqual({ id: 'pf-1' });
  });

  it('throws when format is missing', async () => {
    mockPrisma.pointFormat.findUnique.mockResolvedValue(null);

    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
