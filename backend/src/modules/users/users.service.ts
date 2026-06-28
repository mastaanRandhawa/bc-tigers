import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import type { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';
import {
  canActorManageTarget,
  canActorResetTargetPassword,
} from '../auth/role-utils';
import { CoachTeamRequestsService } from '../teams/coach-team-requests.service';
import { applyCoachTeamAssignment } from '../teams/coach-team-link';

/** Fields an admin may set via PATCH /users/:id. Excludes role, password_hash, id. */
const USER_UPDATE_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'profile_image',
  'active',
] as const;

const SELECT = {
  id: true,
  first_name: true,
  last_name: true,
  email: true,
  role: true,
  phone: true,
  profile_image: true,
  active: true,
  approved: true,
  coaching_request: true,
  created_at: true,
  updated_at: true,
  coached_teams: {
    select: {
      id: true,
      name: true,
      slug: true,
      division: { select: { id: true, name: true } },
    },
  },
  team_requests: {
    where: { status: 'PENDING' },
    select: {
      id: true,
      status: true,
      created_at: true,
      team: {
        select: {
          id: true,
          name: true,
          division: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' as const },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly teamRequests: CoachTeamRequestsService) {}
  findAll(params?: {
    page?: number;
    limit?: number;
    role?: UserRole;
    approved?: boolean;
  }) {
    const { page = 1, limit = 20, role, approved } = params ?? {};
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (approved !== undefined) where.approved = approved;

    return prisma.user.findMany({
      where,
      select: SELECT,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }

  async create(
    actorRole: UserRole,
    data: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      phone?: string;
      role?: UserRole;
    },
  ) {
    const role = data.role ?? 'ADMIN';
    if (!canActorManageTarget(actorRole, role)) {
      throw new ForbiddenException(
        'Only a super administrator can create administrator accounts.',
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const isStaff = role === 'ADMIN' || role === 'SUPERADMIN';
    const password_hash = await bcrypt.hash(data.password, 12);
    return prisma.user.create({
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password_hash,
        phone: data.phone,
        role,
        approved: isStaff,
        active: isStaff,
      },
      select: SELECT,
    });
  }

  async update(actorRole: UserRole, id: string, data: unknown) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    if (!canActorManageTarget(actorRole, existing.role)) {
      throw new ForbiddenException(
        'Only a super administrator can modify administrator accounts.',
      );
    }

    const input = pickAllowed<Prisma.UserUpdateInput>(data, USER_UPDATE_FIELDS);
    return prisma.user.update({
      where: { id },
      data: input,
      select: SELECT,
    });
  }

  async approve(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'COACH') {
      throw new BadRequestException('Only coach accounts can be approved');
    }

    return prisma.user.update({
      where: { id },
      data: { approved: true, active: true },
      select: SELECT,
    });
  }

  async resetPassword(actorId: string, targetId: string, password: string) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Actor not found');

    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('User not found');

    if (!canActorResetTargetPassword(actor.role, user.role)) {
      throw new ForbiddenException(
        user.role === 'ADMIN' || user.role === 'SUPERADMIN'
          ? 'Only a super administrator can reset administrator passwords.'
          : "You cannot reset this user's password.",
      );
    }

    const password_hash = await bcrypt.hash(password, 12);
    return prisma.user.update({
      where: { id: targetId },
      data: { password_hash },
      select: SELECT,
    });
  }

  async remove(actorId: string, actorRole: UserRole, id: string) {
    if (actorId === id) {
      throw new ForbiddenException('You cannot delete your own account.');
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    if (!canActorManageTarget(actorRole, existing.role)) {
      throw new ForbiddenException(
        'Only a super administrator can delete administrator accounts.',
      );
    }

    return prisma.user.delete({ where: { id } });
  }

  async assignCoachTeam(coachUserId: string, teamId: string) {
    const user = await prisma.user.findUnique({ where: { id: coachUserId } });
    if (!user || user.role !== 'COACH') {
      throw new BadRequestException('User must be a coach');
    }

    const team = await prisma.team.findFirst({
      where: { id: teamId, is_deleted: false },
    });
    if (!team) throw new NotFoundException('Team not found');

    await applyCoachTeamAssignment(teamId, coachUserId);
    return prisma.user.findUnique({ where: { id: coachUserId }, select: SELECT });
  }

  async unassignCoachTeam(coachUserId: string, teamId: string) {
    await this.teamRequests.unassignCoachFromTeam(coachUserId, teamId);
    return prisma.user.findUnique({ where: { id: coachUserId }, select: SELECT });
  }

  approveTeamRequest(requestId: string) {
    return this.teamRequests.approve(requestId);
  }

  rejectTeamRequest(requestId: string) {
    return this.teamRequests.reject(requestId);
  }
}
