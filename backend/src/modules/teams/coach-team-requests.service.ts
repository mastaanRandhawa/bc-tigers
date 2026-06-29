import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../../prisma/prisma';
import {
  applyCoachTeamAssignment,
  validateCoachCanBeAssigned,
} from '../teams/coach-team-link';

const REQUEST_INCLUDE = {
  team: {
    select: {
      id: true,
      name: true,
      slug: true,
      coach_user_id: true,
      division: {
        select: {
          id: true,
          name: true,
          tournament: { select: { id: true, name: true } },
        },
      },
    },
  },
} as const;

@Injectable()
export class CoachTeamRequestsService {
  listForCoach(coachUserId: string) {
    return prisma.coachTeamRequest.findMany({
      where: { coach_user_id: coachUserId },
      include: REQUEST_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
  }

  listPendingForCoach(coachUserId: string) {
    return prisma.coachTeamRequest.findMany({
      where: { coach_user_id: coachUserId, status: 'PENDING' },
      include: REQUEST_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
  }

  async create(coachUserId: string, teamId: string) {
    const team = await prisma.team.findFirst({
      where: { id: teamId, is_deleted: false },
      select: { id: true, name: true, coach_user_id: true },
    });
    if (!team) throw new NotFoundException('Team not found');
    if (team.coach_user_id === coachUserId) {
      throw new BadRequestException('You are already assigned to this team');
    }
    if (team.coach_user_id) {
      throw new BadRequestException('This team already has an assigned coach');
    }

    const existing = await prisma.coachTeamRequest.findUnique({
      where: {
        coach_user_id_team_id: { coach_user_id: coachUserId, team_id: teamId },
      },
    });
    if (existing?.status === 'PENDING') {
      throw new BadRequestException(
        'You already have a pending request for this team',
      );
    }
    if (existing?.status === 'APPROVED') {
      throw new BadRequestException('You are already approved for this team');
    }

    if (existing) {
      return prisma.coachTeamRequest.update({
        where: { id: existing.id },
        data: { status: 'PENDING' },
        include: REQUEST_INCLUDE,
      });
    }

    return prisma.coachTeamRequest.create({
      data: { coach_user_id: coachUserId, team_id: teamId },
      include: REQUEST_INCLUDE,
    });
  }

  async createManyForRegistration(coachUserId: string, teamIds: string[]) {
    const uniqueIds = [...new Set(teamIds)];
    const teams = await prisma.team.findMany({
      where: { id: { in: uniqueIds }, is_deleted: false, coach_user_id: null },
      select: { id: true, name: true, division: { select: { name: true } } },
    });
    if (teams.length === 0) {
      throw new BadRequestException('No valid unassigned teams selected');
    }

    await prisma.$transaction(
      teams.map((team) =>
        prisma.coachTeamRequest.upsert({
          where: {
            coach_user_id_team_id: {
              coach_user_id: coachUserId,
              team_id: team.id,
            },
          },
          create: {
            coach_user_id: coachUserId,
            team_id: team.id,
            status: 'PENDING',
          },
          update: { status: 'PENDING' },
        }),
      ),
    );

    const summary = teams
      .map((t) => `${t.name} (${t.division.name})`)
      .join(', ');
    return summary;
  }

  async approve(requestId: string) {
    const request = await prisma.coachTeamRequest.findUnique({
      where: { id: requestId },
      include: {
        team: { select: { id: true, coach_user_id: true, name: true } },
      },
    });
    if (!request) throw new NotFoundException('Team request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only pending requests can be approved');
    }
    if (
      request.team.coach_user_id &&
      request.team.coach_user_id !== request.coach_user_id
    ) {
      throw new BadRequestException(
        `${request.team.name} already has a different coach assigned`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await validateCoachCanBeAssigned(request.coach_user_id);
      await tx.team.update({
        where: { id: request.team_id },
        data: { coach_user_id: request.coach_user_id },
      });
      await tx.coachTeamRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });
    });

    return prisma.coachTeamRequest.findUnique({
      where: { id: requestId },
      include: REQUEST_INCLUDE,
    });
  }

  async reject(requestId: string) {
    const request = await prisma.coachTeamRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Team request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    return prisma.coachTeamRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
      include: REQUEST_INCLUDE,
    });
  }

  async unassignCoachFromTeam(coachUserId: string, teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { coach_user_id: true },
    });
    if (!team) throw new NotFoundException('Team not found');
    if (team.coach_user_id !== coachUserId) {
      throw new BadRequestException('Coach is not assigned to this team');
    }

    await applyCoachTeamAssignment(teamId, null);
    return { team_id: teamId, coach_user_id: null };
  }
}
