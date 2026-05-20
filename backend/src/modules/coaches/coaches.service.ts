import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

@Injectable()
export class CoachesService {
  findAll() {
    return prisma.coach.findMany({
      include: {
        team_coaches: {
          include: { team: { include: { division: { include: { tournament: true } } } } },
        },
        user: { select: { id: true, email: true, role: true } },
      },
      orderBy: { last_name: 'asc' },
    });
  }

  async findOne(id: string) {
    const coach = await prisma.coach.findUnique({
      where: { id },
      include: {
        team_coaches: {
          include: { team: { include: { division: { include: { tournament: true } } } } },
        },
        user: { select: { id: true, email: true, role: true } },
      },
    });
    if (!coach) throw new NotFoundException('Coach not found');
    return coach;
  }

  create(data: unknown) {
    return prisma.coach.create({
      data: data as Prisma.CoachCreateInput,
      include: { team_coaches: { include: { team: true } } },
    });
  }

  update(id: string, data: unknown) {
    return prisma.coach.update({
      where: { id },
      data: data as Prisma.CoachUpdateInput,
      include: { team_coaches: { include: { team: true } } },
    });
  }

  remove(id: string) {
    return prisma.coach.delete({ where: { id } });
  }

  async assignToTeam(teamId: string, coachId: string, role?: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    const coach = await prisma.coach.findUnique({ where: { id: coachId } });
    if (!coach) throw new NotFoundException('Coach not found');

    return prisma.teamCoach.create({
      data: { team_id: teamId, coach_id: coachId, role },
      include: { coach: true, team: true },
    });
  }

  async removeFromTeam(teamId: string, teamCoachId: string) {
    const record = await prisma.teamCoach.findFirst({
      where: { id: teamCoachId, team_id: teamId },
    });
    if (!record) throw new NotFoundException('Team coach assignment not found');
    return prisma.teamCoach.delete({ where: { id: teamCoachId } });
  }
}
