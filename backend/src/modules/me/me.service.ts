import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { Prisma, UserRole } from '@prisma/client';
import prisma from '../../prisma/prisma';

const MATCH_LIST_INCLUDE = {
  home_team: { select: { id: true, name: true, slug: true, logo: true } },
  away_team: { select: { id: true, name: true, slug: true, logo: true } },
  venue: { select: { id: true, name: true, slug: true } },
  tournament: { select: { id: true, name: true, slug: true } },
  division: {
    select: {
      id: true,
      slug: true,
      name: true,
      tournament: { select: { id: true, name: true, slug: true } },
    },
  },
} satisfies Prisma.MatchInclude;

@Injectable()
export class MeService {
  private async teamIdsForUser(userId: string, role: UserRole): Promise<string[]> {
    if (role === 'COACH') {
      const coach = await prisma.coach.findUnique({
        where: { user_id: userId },
        include: { team_coaches: true },
      });
      return coach?.team_coaches.map((tc) => tc.team_id) ?? [];
    }
    if (role === 'PLAYER') {
      const player = await prisma.player.findUnique({
        where: { user_id: userId },
        include: { rosters: { where: { active: true } } },
      });
      return player?.rosters.map((r) => r.team_id) ?? [];
    }
    return [];
  }

  private async matchIdsForReferee(userId: string): Promise<string[]> {
    const referee = await prisma.referee.findUnique({
      where: { user_id: userId },
      include: { match_referees: true },
    });
    return referee?.match_referees.map((mr) => mr.match_id) ?? [];
  }

  async findMyMatches(
    userId: string,
    role: UserRole,
    params?: { status?: string; limit?: number },
  ) {
    const limit = params?.limit ?? 50;
    const statusWhere = params?.status
      ? { status: params.status as Prisma.MatchWhereInput['status'] }
      : {};

    if (role === 'ADMIN' || role === 'TOURNAMENT_ADMIN') {
      return prisma.match.findMany({
        where: statusWhere,
        include: MATCH_LIST_INCLUDE,
        take: limit,
        orderBy: { scheduled_start: 'desc' },
      });
    }

    if (role === 'REFEREE') {
      const matchIds = await this.matchIdsForReferee(userId);
      if (matchIds.length === 0) return [];
      return prisma.match.findMany({
        where: {
          id: { in: matchIds },
          ...statusWhere,
        },
        include: MATCH_LIST_INCLUDE,
        take: limit,
        orderBy: { scheduled_start: 'asc' },
      });
    }

    const teamIds = await this.teamIdsForUser(userId, role);
    if (teamIds.length === 0) return [];

    return prisma.match.findMany({
      where: {
        OR: [
          { home_team_id: { in: teamIds } },
          { away_team_id: { in: teamIds } },
        ],
        ...statusWhere,
      },
      include: MATCH_LIST_INCLUDE,
      take: limit,
      orderBy: { scheduled_start: 'asc' },
    });
  }

  async findMyMatch(userId: string, role: UserRole, matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        home_team: {
          include: {
            rosters: {
              where: { active: true },
              include: { player: true },
            },
          },
        },
        away_team: {
          include: {
            rosters: {
              where: { active: true },
              include: { player: true },
            },
          },
        },
        venue: true,
        referees: { include: { referee: true } },
        events: {
          include: { player: true, team: true },
          orderBy: { minute: 'asc' },
        },
        tournament: true,
        division: true,
      },
    });
    if (!match) throw new NotFoundException('Match not found');

    const allowed = await this.canAccessMatch(userId, role, match);
    if (!allowed) throw new ForbiddenException('You do not have access to this match');

    return match;
  }

  async canAccessMatch(
    userId: string,
    role: UserRole,
    match: { id: string; home_team_id: string; away_team_id: string },
  ): Promise<boolean> {
    if (role === 'ADMIN' || role === 'TOURNAMENT_ADMIN') return true;

    if (role === 'REFEREE') {
      const referee = await prisma.referee.findUnique({
        where: { user_id: userId },
      });
      if (!referee) return false;
      const assigned = await prisma.matchReferee.findFirst({
        where: { match_id: match.id, referee_id: referee.id },
      });
      return !!assigned;
    }

    const teamIds = await this.teamIdsForUser(userId, role);
    return (
      teamIds.includes(match.home_team_id) || teamIds.includes(match.away_team_id)
    );
  }
}
