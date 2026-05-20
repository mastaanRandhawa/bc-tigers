import { Injectable } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { MatchesService } from '../matches/matches.service';

@Injectable()
export class HubService {
  constructor(private readonly matchesService: MatchesService) {}

  async getHomeFeed() {
    const [tournaments, liveMatches, recentMatches, upcomingMatches] =
      await Promise.all([
        prisma.tournament.findMany({
          take: 12,
          orderBy: { start_date: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            status: true,
            start_date: true,
            end_date: true,
            logo: true,
          },
        }),
        this.matchesService.findAll({ status: 'LIVE', limit: 10 }),
        this.matchesService.findAll({
          statuses: ['LIVE', 'COMPLETED'],
          limit: 4,
        }),
        this.matchesService.findAll({ status: 'SCHEDULED', limit: 4 }),
      ]);

    return {
      tournaments,
      liveMatches,
      recentMatches,
      upcomingMatches,
    };
  }
}
