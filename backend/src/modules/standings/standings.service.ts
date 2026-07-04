import { Injectable } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { computeGroupedStandings } from '../../engine/standings';
import {
  mapPrismaMatchToResult,
  toTournamentConfig,
} from '../../engine/point-format-mapper';
import { eliminationMatchIdsForDivision } from '../matches/match-outcome';

@Injectable()
export class StandingsService {
  async getByDivision(divisionId: string) {
    const rows = await prisma.standing.findMany({
      where: { division_id: divisionId },
      include: { team: true, group: true },
      orderBy: [{ group: { order: 'asc' } }, { rank: 'asc' }],
    });

    const memberships = await prisma.teamDivision.findMany({
      where: { division_id: divisionId },
      select: { team_id: true, slug: true, group_id: true },
    });
    const slugByTeam = new Map(memberships.map((m) => [m.team_id, m.slug]));

    return rows.map((row) => ({
      ...row,
      team: row.team
        ? {
            ...row.team,
            slug: slugByTeam.get(row.team_id) ?? '',
            division_id: divisionId,
            group_id: row.group_id,
          }
        : row.team,
    }));
  }

  async recalculate(divisionId: string) {
    const [matches, division, teams, eliminationIds] = await Promise.all([
      prisma.match.findMany({
        where: { division_id: divisionId, status: 'COMPLETED' },
      }),
      prisma.division.findUniqueOrThrow({
        where: { id: divisionId },
        include: { point_format: true },
      }),
      prisma.teamDivision.findMany({
        where: { division_id: divisionId },
        select: { team_id: true, group_id: true },
      }),
      eliminationMatchIdsForDivision(divisionId),
    ]);

    const leagueMatches = matches.filter((m) => !eliminationIds.has(m.id));
    const results = leagueMatches.map(mapPrismaMatchToResult);
    const config = toTournamentConfig(division.point_format);
    const rows = computeGroupedStandings(
      teams.map((t) => ({ id: t.team_id, groupId: t.group_id })),
      results,
      config,
      division.groups_enabled,
    );

    await prisma.$transaction(
      rows.map((row) =>
        prisma.standing.upsert({
          where: {
            division_id_team_id: {
              division_id: divisionId,
              team_id: row.teamId,
            },
          },
          create: {
            division_id: divisionId,
            group_id: row.groupId,
            team_id: row.teamId,
            rank: row.rank,
            played: row.played,
            wins: row.wins,
            draws: row.draws,
            losses: row.losses,
            goals_for: row.goalsFor,
            goals_against: row.goalsAgainst,
            goal_difference: row.goalDifference,
            points: row.points,
          },
          update: {
            group_id: row.groupId,
            rank: row.rank,
            played: row.played,
            wins: row.wins,
            draws: row.draws,
            losses: row.losses,
            goals_for: row.goalsFor,
            goals_against: row.goalsAgainst,
            goal_difference: row.goalDifference,
            points: row.points,
          },
        }),
      ),
    );

    return this.getByDivision(divisionId);
  }
}
