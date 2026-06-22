import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
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
}));

jest.mock('bcrypt');

import prisma from '../../prisma/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService coach gates', () => {
  let service: AuthService;
  const audit = { log: jest.fn() };
  const mail = { send: jest.fn(), appUrl: jest.fn((p: string) => p) };
  const jwt = { sign: jest.fn().mockReturnValue('token') } as unknown as JwtService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(jwt, mail as never, audit as never);
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
    } as never);

    await expect(service.login('coach@test.com', 'pass')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('allows approved active coach login', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser as never);

    const result = await service.login('coach@test.com', 'pass');
    expect(result.access_token).toBe('token');
    expect(result.user.role).toBe('COACH');
  });

  it('rejects coach change password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser as never);

    await expect(
      service.changePassword('user-1', 'old', 'newpassword'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns admin-contact message for coach forgot password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser as never);

    const result = await service.forgotPassword('coach@test.com');
    expect(result.message).toContain('administrator');
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('registers coach as pending without issuing token', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 'new-coach' } as never);

    const result = await service.registerCoach({
      first_name: 'New',
      last_name: 'Coach',
      email: 'new@test.com',
      password: 'password123',
      coaching_request: 'BC Tigers U14',
    });

    expect(result.message).toContain('administrator');
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'COACH',
          approved: false,
          active: false,
          coaching_request: 'BC Tigers U14',
        }),
      }),
    );
  });
});
