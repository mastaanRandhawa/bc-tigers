import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import prisma from '../../prisma/prisma';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  async register(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'VIEWER' | 'COACH';
  }) {
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const password_hash = await bcrypt.hash(data.password, 12);
    const role = data.role === 'COACH' ? 'COACH' : 'VIEWER';
    const user = await prisma.user.create({
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password_hash,
        phone: data.phone,
        role,
      },
    });

    if (role === 'COACH') {
      await prisma.coach.create({
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          user_id: user.id,
        },
      });
    }

    return this.signToken(user);
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user);
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        phone: true,
        profile_image: true,
        created_at: true,
        player: {
          include: {
            rosters: {
              where: { active: true },
              include: { team: { include: { division: { include: { tournament: true } } } } },
            },
          },
        },
        coach: {
          include: {
            team_coaches: {
              include: { team: { include: { division: { include: { tournament: true } } } } },
            },
          },
        },
        referee: {
          include: {
            match_referees: {
              include: {
                match: {
                  include: {
                    home_team: true,
                    away_team: true,
                    venue: true,
                    division: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      first_name?: string;
      last_name?: string;
      phone?: string;
      profile_image?: string;
    },
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        phone: true,
        profile_image: true,
        created_at: true,
      },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const password_hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password_hash } });
    return { message: 'Password updated successfully.' };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    await prisma.passwordResetToken.updateMany({
      where: { user_id: user.id, used_at: null },
      data: { used_at: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { user_id: user.id, token, expires_at },
    });

    return {
      message: 'If the email exists, a reset link has been sent.',
      reset_token: process.env.NODE_ENV !== 'production' ? token : undefined,
    };
  }

  async resetPassword(token: string, password: string) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.used_at || record.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const password_hash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.user_id },
        data: { password_hash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { used_at: new Date() },
      }),
    ]);

    return { message: 'Password reset successfully.' };
  }

  private signToken(user: {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwt.sign(payload);
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  }
}
