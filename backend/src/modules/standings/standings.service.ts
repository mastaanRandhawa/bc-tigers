import { Injectable } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { computeStandings } from '../../engine/standings';
import {
  buildFairPlayMap,
  mapPrismaMatchToResult,
  toTournamentConfig,
} from '../../engine/point-format-mapper';

@Injectable()
export class StandingsService {
  getByDivision(divisionId: string) {
    return prisma.standing.findMany({
      where: { division_id: divisionId },
      include: { team: true },
      orderBy: { rank: 'asc' },
    });
  }

  async recalculate(divisionId: string) {
    const [matches, division, teams, cardEvents] = await Promise.all([
      prisma.match.findMany({
        where: { division_id: divisionId, status: 'COMPLETED' },
      }),
      prisma.division.findUniqueOrThrow({
        where: { id: divisionId },
        include: { point_format: true },
      }),
      prisma.team.findMany({ where: { division_id: divisionId }, select: { id: true } }),
      prisma.matchEvent.findMany({
        where: {
          type: { in: ['YELLOW_CARD', 'RED_CARD'] },
          match: { division_id: divisionId, status: 'COMPLETED' },
        },
        select: { team_id: true, type: true },
      }),
    ]);

    const teamIds = teams.map((t) => t.id);
    const fairPlay = buildFairPlayMap(cardEvents, teamIds);
    const results = matches.map(mapPrismaMatchToResult);
    const config = toTournamentConfig(division.point_format);
    const rows = computeStandings(teamIds, results, config, fairPlay);

    await prisma.$transaction(
      rows.map((row) =>
        prisma.standing.upsert({
          where: {
            division_id_team_id: { division_id: divisionId, team_id: row.teamId },
          },
          create: {
            division_id: divisionId,
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
            fair_play: fairPlay.get(row.teamId) ?? 0,
          },
          update: {
            rank: row.rank,
            played: row.played,
            wins: row.wins,
            draws: row.draws,
            losses: row.losses,
            goals_for: row.goalsFor,
            goals_against: row.goalsAgainst,
            goal_difference: row.goalDifference,
            points: row.points,
            fair_play: fairPlay.get(row.teamId) ?? 0,
          },
        }),
      ),
    );

    return this.getByDivision(divisionId);
  }
}
