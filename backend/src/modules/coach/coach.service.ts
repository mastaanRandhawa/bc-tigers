import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';
import {
  isCoachManagementLocked,
  getCoachLockStatus,
} from '../auth/coach-permissions';
import { getCoachTeamId, getCoachTeamIds } from '../teams/coach-team-link';
import { TeamPlayersService } from '../teams/team-players.service';
import { CoachTeamRequestsService } from '../teams/coach-team-requests.service';
import { getMaxPlayersPerTeam } from '../settings/settings.service';
import {
  enrichMatchesWithTeamSlugs,
  flattenTeamForDivision,
  type TeamWithMemberships,
} from '../teams/team-membership';

const COACH_TEAM_FIELDS = [
  'logo',
  'city',
  'primary_color',
  'secondary_color',
  'contact_email',
  'contact_phone',
] as const;

const TEAM_INCLUDE = {
  divisions: {
    include: {
      division: { include: { tournament: true } },
      group: { select: { id: true, name: true, slug: true, order: true } },
    },
    orderBy: { created_at: 'asc' as const },
  },
  coach: {
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
    },
  },
  players: {
    orderBy: [{ active: 'desc' as const }, { last_name: 'asc' as const }],
  },
};

function flattenCoachTeam(team: TeamWithMemberships) {
  const primary = team.divisions[0];
  if (!primary) return { ...team, division_id: '', slug: '', division: undefined };
  return flattenTeamForDivision(team, primary.division_id);
}

@Injectable()
export class CoachService {
  constructor(
    private readonly players: TeamPlayersService,
    private readonly teamRequests: CoachTeamRequestsService,
  ) {}

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
        coached_teams: {
          select: {
            id: true,
            name: true,
            management_locked: true,
            divisions: {
              take: 1,
              orderBy: { created_at: 'asc' },
              select: {
                slug: true,
                division: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const team_ids = await getCoachTeamIds(userId);
    const lockStatus = await getCoachLockStatus();
    return {
      ...user,
      team_ids,
      team_id: team_ids[0] ?? null,
      coached_teams: user.coached_teams.map((t) => {
        const m = t.divisions[0];
        return {
          id: t.id,
          name: t.name,
          slug: m?.slug ?? '',
          management_locked: t.management_locked,
          division: m?.division,
        };
      }),
      ...lockStatus,
    };
  }

  async listTeams(userId: string) {
    const teamIds = await getCoachTeamIds(userId);
    if (teamIds.length === 0) return [];

    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      include: TEAM_INCLUDE,
      orderBy: { name: 'asc' },
    });
    return teams.map((t) => flattenCoachTeam(t as TeamWithMemberships));
  }

  listTeamRequests(userId: string) {
    return this.teamRequests.listForCoach(userId);
  }

  createTeamRequest(userId: string, teamId: string) {
    return this.teamRequests.create(userId, teamId);
  }

  async getTeamForCoach(userId: string, teamId?: string | null) {
    const resolvedTeamId = await getCoachTeamId(userId, teamId);
    const lockStatus = await getCoachLockStatus();
    const teamIds = await getCoachTeamIds(userId);

    if (!resolvedTeamId) {
      return {
        assigned: false,
        teams: [],
        team_ids: teamIds,
        ...lockStatus,
        can_edit: false,
      };
    }

    const team = await this.getTeam(resolvedTeamId);
    const max_players_per_team = await getMaxPlayersPerTeam();
    const roster_count = team.players?.length ?? 0;
    return {
      assigned: true,
      teams: await this.listTeams(userId),
      team_ids: teamIds,
      selected_team_id: resolvedTeamId,
      ...team,
      ...lockStatus,
      max_players_per_team,
      roster_count,
      can_edit: !lockStatus.coach_management_locked && !team.management_locked,
    };
  }

  async getTeam(teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: TEAM_INCLUDE,
    });
    if (!team) throw new NotFoundException('Team not found');

    const globalLocked = await isCoachManagementLocked();
    const max_players_per_team = await getMaxPlayersPerTeam();
    const flat = flattenCoachTeam(team as TeamWithMemberships);
    return {
      ...flat,
      players: team.players,
      coach: team.coach,
      coach_management_locked: globalLocked,
      max_players_per_team,
      roster_count: team.players.length,
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

  async findTeamMatches(userId: string, teamId?: string | null) {
    const resolvedTeamId = await getCoachTeamId(userId, teamId);
    if (!resolvedTeamId) return [];

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { home_team_id: resolvedTeamId },
          { away_team_id: resolvedTeamId },
        ],
      },
      include: {
        home_team: { select: { id: true, name: true, logo: true } },
        away_team: { select: { id: true, name: true, logo: true } },
        division: {
          select: {
            id: true,
            slug: true,
            name: true,
            tournament: { select: { id: true, name: true, slug: true } },
          },
        },
        venue: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { scheduled_start: 'asc' },
      take: 30,
    });
    return enrichMatchesWithTeamSlugs(matches);
  }
}
