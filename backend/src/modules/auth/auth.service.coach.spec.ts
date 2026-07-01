import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
    team: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('./coach-permissions', () => ({
  getCoachTeamId: jest.fn().mockResolvedValue('team-1'),
  getCoachTeamIds: jest.fn().mockResolvedValue(['team-1']),
}));

jest.mock('bcrypt');

import prisma from '../../prisma/prisma';
import { asMockedPrisma } from '../../test-utils/prisma-mock';

const mockPrisma = asMockedPrisma(prisma);
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const teamRequests = {
  createManyForRegistration: jest.fn().mockResolvedValue('Team A (U14)'),
};

describe('AuthService coach gates', () => {
  let service: AuthService;
  const audit = { log: jest.fn() };
  const mail = { send: jest.fn(), appUrl: jest.fn((p: string) => p) };
  const jwt = {
    sign: jest.fn().mockReturnValue('token'),
  } as unknown as JwtService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      jwt,
      mail as never,
      audit as never,
      teamRequests as never,
    );
    mockBcrypt.compare.mockResolvedValue(true as never);
    mockBcrypt.hash.mockResolvedValue('hashed' as never);
  });

  const baseUser = {
    id: 'user-1',
    email: 'coach@test.com',
    password_hash: 'hash',
    first_name: 'Coach',
    last_name: 'Test',
    role: 'COACH' as const,
    approved: true,
    active: true,
  };

  it('blocks pending coach login', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      approved: false,
      active: false,
    });

    await expect(
      service.login('coach@test.com', 'pass'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows approved active coach login', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);

    const result = await service.login('coach@test.com', 'pass');
    expect(result.access_token).toBe('token');
    expect(result.user.role).toBe('COACH');
  });

  it.each(['ADMIN', 'SUPERADMIN', 'COACH'] as const)(
    'lets %s change their own password with the correct current password',
    async (role) => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        id: role === 'COACH' ? 'user-1' : 'admin-1',
        role,
      });
      mockBcrypt.compare.mockResolvedValue(true as never);

      const userId = role === 'COACH' ? 'user-1' : 'admin-1';
      const result = await service.changePassword(
        userId,
        'oldpass',
        'newpassword',
      );

      expect(result.message).toContain('updated');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword', 12);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password_hash: 'hashed' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_CHANGE', userId }),
      );
    },
  );

  const adminUser = {
    ...baseUser,
    id: 'admin-1',
    email: 'admin@test.com',
    role: 'ADMIN' as const,
  };

  it('rejects a password change when the current password is wrong', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(adminUser);
    mockBcrypt.compare.mockResolvedValue(false as never);

    await expect(
      service.changePassword('admin-1', 'wrong', 'newpassword'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('returns admin-contact message for coach forgot password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);

    const result = await service.forgotPassword('coach@test.com');
    expect(result.message).toContain('administrator');
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('registers coach as pending without issuing token', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 'new-coach' });

    const result = await service.registerCoach({
      first_name: 'New',
      last_name: 'Coach',
      email: 'new@test.com',
      password: 'password123',
      phone: '604-555-0100',
      team_ids: ['team-1'],
    });

    expect(result.message).toContain('administrator');
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'COACH',
          approved: false,
          active: false,
          phone: '604-555-0100',
        }),
      }),
    );
    expect(teamRequests.createManyForRegistration).toHaveBeenCalledWith(
      'new-coach',
      ['team-1'],
    );
  });
});
