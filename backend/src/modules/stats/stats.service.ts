import { Injectable } from '@nestjs/common';
import prisma from '../../prisma/prisma';

@Injectable()
export class StatsService {
  private baseWhere(params?: { tournamentId?: string; divisionId?: string }) {
    return {
      ...(params?.tournamentId ? { tournament_id: params.tournamentId } : {}),
      ...(params?.divisionId ? { division_id: params.divisionId } : {}),
    };
  }

  topScorers(params?: {
    tournamentId?: string;
    divisionId?: string;
    limit?: number;
  }) {
    return prisma.playerStat.findMany({
      where: this.baseWhere(params),
      include: { player: true, tournament: true },
      orderBy: { goals: 'desc' },
      take: params?.limit ?? 20,
    });
  }

  topAssists(params?: {
    tournamentId?: string;
    divisionId?: string;
    limit?: number;
  }) {
    return prisma.playerStat.findMany({
      where: this.baseWhere(params),
      include: { player: true, tournament: true },
      orderBy: { assists: 'desc' },
      take: params?.limit ?? 20,
    });
  }

  discipline(params?: {
    tournamentId?: string;
    divisionId?: string;
    limit?: number;
  }) {
    return prisma.playerStat.findMany({
      where: this.baseWhere(params),
      include: { player: true, tournament: true },
      orderBy: [{ yellow_cards: 'desc' }, { red_cards: 'desc' }],
      take: params?.limit ?? 20,
    });
  }

  async summary() {
    const [
      tournaments,
      teams,
      players,
      matches,
      venues,
      coaches,
      liveMatches,
    ] = await Promise.all([
      prisma.tournament.count(),
      prisma.team.count(),
      prisma.player.count(),
      prisma.match.count(),
      prisma.venue.count(),
      prisma.coach.count(),
      prisma.match.count({ where: { status: 'LIVE' } }),
    ]);

    const topScorer = await prisma.playerStat.findFirst({
      orderBy: { goals: 'desc' },
      include: { player: true },
    });

    return {
      tournaments,
      teams,
      players,
      matches,
      venues,
      coaches,
      live_matches: liveMatches,
      top_scorer: topScorer
        ? {
            name: `${topScorer.player.first_name} ${topScorer.player.last_name}`,
            goals: topScorer.goals,
          }
        : null,
    };
  }
}
