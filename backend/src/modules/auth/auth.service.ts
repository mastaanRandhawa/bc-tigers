import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import prisma from '../../prisma/prisma';
import { MailService } from '../mail/mail.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { getCoachTeamId } from './coach-permissions';
import type { RegisterCoachDto } from './dto/register-coach.dto';

const COACH_PASSWORD_MESSAGE =
  'Coach password resets are managed by an administrator. Please contact your tournament administrator.';
const ADMIN_PASSWORD_MESSAGE =
  'Administrator passwords can only be reset by a super administrator.';
const SUPERADMIN_PASSWORD_MESSAGE =
  'Super administrator passwords can only be reset by another super administrator.';
@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private mailService: MailService,
    private audit: AuditLogService,
  ) {}

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.role === 'COACH') {
      if (!user.approved) {
        throw new UnauthorizedException(
          'Your account is pending administrator approval.',
        );
      }
      if (!user.active) {
        throw new UnauthorizedException('Your coach account is inactive.');
      }
    } else if (!['ADMIN', 'SUPERADMIN'].includes(user.role) || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.audit.log({
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
    });
    return this.signToken(user);
  }

  async registerCoach(data: RegisterCoachDto) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already in use');

    const password_hash = await bcrypt.hash(data.password, 12);
    await prisma.user.create({
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password_hash,
        phone: data.phone,
        coaching_request: data.coaching_request.trim(),
        role: 'COACH',
        approved: false,
        active: false,
      },
    });

    return {
      message:
        'Registration received. An administrator will review your account before you can sign in.',
    };
  }

  async logout(userId: string) {
    await this.audit.log({
      action: 'LOGOUT',
      entity: 'User',
      entityId: userId,
      userId,
    });
    return { success: true };
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
        approved: true,
        active: true,
        created_at: true,
        coached_team: { select: { id: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const team_id =
      user.role === 'COACH' ? (user.coached_team?.id ?? null) : null;
    const { coached_team: _team, ...rest } = user;
    return { ...rest, team_id };
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
    if (user.role === 'COACH') {
      throw new ForbiddenException(COACH_PASSWORD_MESSAGE);
    }
    if (user.role === 'ADMIN') {
      throw new ForbiddenException(ADMIN_PASSWORD_MESSAGE);
    }
    if (user.role === 'SUPERADMIN') {
      throw new ForbiddenException(SUPERADMIN_PASSWORD_MESSAGE);
    }

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
    if (user.role === 'COACH') {
      return { message: COACH_PASSWORD_MESSAGE };
    }
    if (user.role === 'ADMIN') {
      return { message: ADMIN_PASSWORD_MESSAGE };
    }
    if (user.role === 'SUPERADMIN') {
      return { message: SUPERADMIN_PASSWORD_MESSAGE };
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

    const resetUrl = this.mailService.appUrl(`/reset-password?token=${token}`);
    const mailResult = await this.mailService.send({
      to: user.email,
      subject: 'Reset your BC Tigers password',
      text: `Use this link to reset your password (expires in 1 hour): ${resetUrl}`,
      html: `<p>Use this link to reset your password (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    if (!mailResult.ok) {
      throw new ServiceUnavailableException(
        'Unable to send password reset email. Contact an administrator.',
      );
    }

    return {
      message: 'If the email exists, a reset link has been sent.',
      reset_token:
        process.env.DEV_EXPOSE_RESET_TOKEN === 'true' ? token : undefined,
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
    if (record.user.role === 'COACH') {
      throw new ForbiddenException(COACH_PASSWORD_MESSAGE);
    }
    if (record.user.role === 'ADMIN') {
      throw new ForbiddenException(ADMIN_PASSWORD_MESSAGE);
    }
    if (record.user.role === 'SUPERADMIN') {
      throw new ForbiddenException(SUPERADMIN_PASSWORD_MESSAGE);
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

    await this.audit.log({
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: record.user_id,
      userId: record.user_id,
    });
    return { message: 'Password reset successfully.' };
  }

  private async signToken(user: {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  }) {
    const teamId =
      user.role === 'COACH' ? await getCoachTeamId(user.id) : null;
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      ...(teamId ? { teamId } : {}),
    };
    const access_token = this.jwt.sign(payload);
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        ...(teamId ? { team_id: teamId } : {}),
      },
    };
  }
}
