import { Injectable } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { computeGroupedStandings } from '../../engine/standings';
import {
  mapPrismaMatchToResult,
  toTournamentConfig,
} from '../../engine/point-format-mapper';

@Injectable()
export class StandingsService {
  getByDivision(divisionId: string) {
    return prisma.standing.findMany({
      where: { division_id: divisionId },
      include: { team: true, group: true },
      // Group first (so grouped tables stay contiguous), then by rank within group.
      orderBy: [{ group: { order: 'asc' } }, { rank: 'asc' }],
    });
  }

  async recalculate(divisionId: string) {
    const [matches, division, teams] = await Promise.all([
      prisma.match.findMany({
        where: { division_id: divisionId, status: 'COMPLETED' },
      }),
      prisma.division.findUniqueOrThrow({
        where: { id: divisionId },
        include: { point_format: true },
      }),
      prisma.team.findMany({
        where: { division_id: divisionId },
        select: { id: true, group_id: true },
      }),
    ]);

    const results = matches.map(mapPrismaMatchToResult);
    const config = toTournamentConfig(division.point_format);
    const rows = computeGroupedStandings(
      teams.map((t) => ({ id: t.id, groupId: t.group_id })),
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
