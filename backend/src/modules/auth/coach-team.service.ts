import { Injectable, ForbiddenException } from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import prisma from '../../prisma/prisma';

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'TOURNAMENT_ADMIN'];

@Injectable()
export class CoachTeamService {
  isAdminRole(role: UserRole) {
    return ADMIN_ROLES.includes(role);
  }

  async assertCoachOwnsTeam(userId: string, role: UserRole, teamId: string) {
    if (this.isAdminRole(role)) return;

    const coach = await prisma.coach.findUnique({ where: { user_id: userId } });
    if (!coach) {
      throw new ForbiddenException('Not authorized to manage this team');
    }

    const link = await prisma.teamCoach.findFirst({
      where: { coach_id: coach.id, team_id: teamId },
    });
    if (!link) {
      throw new ForbiddenException('Not authorized to manage this team');
    }
  }
}
