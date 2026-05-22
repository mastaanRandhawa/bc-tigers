import { Injectable } from '@nestjs/common';
import prisma from '../../prisma/prisma';

@Injectable()
export class StandingsService {
  getByDivision(divisionId: string) {
    return prisma.standing.findMany({
      where: { division_id: divisionId },
      include: { team: true },
      orderBy: [
        { points: 'desc' },
        { goal_difference: 'desc' },
        { goals_for: 'desc' },
        { fair_play: 'desc' },
      ],
    });
  }

  async recalculate(divisionId: string) {
    const [matches, division] = await Promise.all([
      prisma.match.findMany({
        where: { division_id: divisionId, status: 'COMPLETED' },
      }),
      prisma.division.findUniqueOrThrow({ where: { id: divisionId } }),
    ]);

    const statsMap = new Map<
      string,
      {
        played: number;
        wins: number;
        draws: number;
        losses: number;
        goals_for: number;
        goals_against: number;
        points: number;
        fair_play: number;
      }
    >();
    const init = () => ({
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      points: 0,
      fair_play: 0,
    });

    for (const match of matches) {
      if (!statsMap.has(match.home_team_id))
        statsMap.set(match.home_team_id, init());
      if (!statsMap.has(match.away_team_id))
        statsMap.set(match.away_team_id, init());

      const home = statsMap.get(match.home_team_id)!;
      const away = statsMap.get(match.away_team_id)!;

      home.played++;
      away.played++;
      home.goals_for += match.home_score;
      home.goals_against += match.away_score;
      away.goals_for += match.away_score;
      away.goals_against += match.home_score;

      if (match.home_score > match.away_score) {
        home.wins++;
        home.points += division.points_win;
        away.losses++;
        away.points += division.points_loss;
      } else if (match.home_score < match.away_score) {
        away.wins++;
        away.points += division.points_win;
        home.losses++;
        home.points += division.points_loss;
      } else {
        home.draws++;
        away.draws++;
        home.points += division.points_draw;
        away.points += division.points_draw;
      }
    }

    const sorted = Array.from(statsMap.entries()).sort(
      ([, a], [, b]) =>
        b.points - a.points ||
        b.goals_for - b.goals_against - (a.goals_for - a.goals_against) ||
        b.goals_for - a.goals_for ||
        b.fair_play - a.fair_play,
    );

    await prisma.$transaction(
      sorted.map(([team_id, stats], idx) =>
        prisma.standing.upsert({
          where: { division_id_team_id: { division_id: divisionId, team_id } },
          create: {
            division_id: divisionId,
            team_id,
            rank: idx + 1,
            goal_difference: stats.goals_for - stats.goals_against,
            ...stats,
          },
          update: {
            rank: idx + 1,
            goal_difference: stats.goals_for - stats.goals_against,
            ...stats,
          },
        }),
      ),
    );

    return this.getByDivision(divisionId);
  }
}
