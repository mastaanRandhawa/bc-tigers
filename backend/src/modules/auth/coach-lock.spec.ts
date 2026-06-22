import { isCoachLockEffective, resolveCoachLockSettings } from './coach-lock';

jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    siteSettings: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import prisma from '../../prisma/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('coach-lock', () => {
  const now = new Date('2026-06-22T12:00:00.000Z');

  beforeEach(() => jest.clearAllMocks());

  it('is locked when manual flag is set', () => {
    expect(
      isCoachLockEffective(
        { coach_management_locked: true, coach_lock_scheduled_at: null },
        now,
      ),
    ).toBe(true);
  });

  it('is locked when scheduled time has passed', () => {
    expect(
      isCoachLockEffective(
        {
          coach_management_locked: false,
          coach_lock_scheduled_at: new Date('2026-06-22T11:00:00.000Z'),
        },
        now,
      ),
    ).toBe(true);
  });

  it('is not locked when schedule is in the future', () => {
    expect(
      isCoachLockEffective(
        {
          coach_management_locked: false,
          coach_lock_scheduled_at: new Date('2026-06-22T13:00:00.000Z'),
        },
        now,
      ),
    ).toBe(false);
  });

  it('is not locked when no settings', () => {
    expect(isCoachLockEffective(null, now)).toBe(false);
  });

  it('promotes due scheduled lock to manual lock', async () => {
    mockPrisma.siteSettings.findUnique.mockResolvedValue({
      coach_management_locked: false,
      coach_lock_scheduled_at: new Date('2026-06-22T11:00:00.000Z'),
    });
    mockPrisma.siteSettings.update.mockResolvedValue({
      coach_management_locked: true,
      coach_lock_scheduled_at: null,
    });

    const result = await resolveCoachLockSettings(now);

    expect(mockPrisma.siteSettings.update).toHaveBeenCalledWith({
      where: { id: 'default' },
      data: {
        coach_management_locked: true,
        coach_lock_scheduled_at: null,
      },
      select: {
        coach_management_locked: true,
        coach_lock_scheduled_at: true,
      },
    });
    expect(result).toEqual({
      coach_management_locked: true,
      coach_lock_scheduled_at: null,
    });
  });
});
