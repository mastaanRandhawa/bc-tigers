import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';
import { isCoachManagementLocked } from '../auth/coach-permissions';
import { getCoachTeamId } from '../teams/coach-team-link';
import { TeamPlayersService } from '../teams/team-players.service';

const COACH_TEAM_FIELDS = [
  'logo',
  'city',
  'primary_color',
  'secondary_color',
  'contact_email',
  'contact_phone',
] as const;

const TEAM_INCLUDE = {
  division: { include: { tournament: true } },
  coach: {
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
    },
  },
  players: { orderBy: [{ active: 'desc' as const }, { last_name: 'asc' as const }] },
};

@Injectable()
export class CoachService {
  constructor(private readonly players: TeamPlayersService) {}

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
        coached_team: {
          select: {
            id: true,
            name: true,
            slug: true,
            management_locked: true,
            division: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const globalLocked = await isCoachManagementLocked();
    return {
      ...user,
      team_id: user.coached_team?.id ?? null,
      coach_management_locked: globalLocked,
    };
  }

  async getTeamForCoach(userId: string) {
    const teamId = await getCoachTeamId(userId);
    const globalLocked = await isCoachManagementLocked();

    if (!teamId) {
      return {
        assigned: false,
        coach_management_locked: globalLocked,
        can_edit: false,
      };
    }

    const team = await this.getTeam(teamId);
    return { assigned: true, ...team };
  }

  async getTeam(teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: TEAM_INCLUDE,
    });
    if (!team) throw new NotFoundException('Team not found');

    const globalLocked = await isCoachManagementLocked();
    return {
      ...team,
      coach_management_locked: globalLocked,
      can_edit: !globalLocked && !team.management_locked,
    };
  }

  async updateTeam(teamId: string, data: unknown) {
    const payload = pickAllowed(data, COACH_TEAM_FIELDS);
    return prisma.team.update({
      where: { id: teamId },
      data: payload,
      include: TEAM_INCLUDE,
    });
  }

  findPlayers(teamId: string) {
    return this.players.findByTeam(teamId);
  }

  createPlayer(teamId: string, data: unknown) {
    return this.players.create(teamId, data);
  }

  updatePlayer(teamId: string, playerId: string, data: unknown) {
    return this.players.update(teamId, playerId, data);
  }

  removePlayer(teamId: string, playerId: string) {
    return this.players.remove(teamId, playerId);
  }
}
