import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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

/**
 * Single uniform response for the forgot-password endpoint. Returned regardless
 * of whether the email exists or what role it has, so the endpoint cannot be
 * used to enumerate accounts or discover roles. Passwords are admin-managed for
 * every role, so no reset email is ever sent.
 */
const FORGOT_PASSWORD_MESSAGE =
  'If an account exists for that email, password changes are handled by an administrator. Please contact your tournament administrator.';

/** Uniform response for coach registration — identical whether or not the email already exists. */
const COACH_REGISTER_MESSAGE =
  'Registration received. An administrator will review your account before you can sign in.';

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
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    // Don't disclose that the email is already registered — return the same
    // neutral response as a fresh registration (anti-enumeration).
    if (existing) {
      return { message: COACH_REGISTER_MESSAGE };
    }

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

    return { message: COACH_REGISTER_MESSAGE };
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
    const {
      id,
      first_name,
      last_name,
      email,
      role,
      phone,
      profile_image,
      approved,
      active,
      created_at,
    } = user;
    return {
      id,
      first_name,
      last_name,
      email,
      role,
      phone,
      profile_image,
      approved,
      active,
      created_at,
      team_id,
    };
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

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
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
    if (!valid)
      throw new UnauthorizedException('Current password is incorrect');

    const password_hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    });
    return { message: 'Password updated successfully.' };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async forgotPassword(_email: string) {
    // Uniform response for every input — no DB lookup branch, no email, no token.
    // Passwords are admin-managed for all roles, and the response must not reveal
    // whether the account exists or its role (anti-enumeration).
    return { message: FORGOT_PASSWORD_MESSAGE };
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
    const teamId = user.role === 'COACH' ? await getCoachTeamId(user.id) : null;
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
