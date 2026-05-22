import { Injectable } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { MatchesService } from '../matches/matches.service';
import { DivisionsService } from '../divisions/divisions.service';

@Injectable()
export class HubService {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly divisionsService: DivisionsService,
  ) {}

  async getHomeFeed() {
    const [tournaments, liveMatches, recentMatches, upcomingMatches, announcements, featuredMedia] =
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
        prisma.notification.findMany({
          where: { user_id: null },
          orderBy: { created_at: 'desc' },
          take: 6,
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            created_at: true,
            tournament_id: true,
          },
        }),
        prisma.media.findMany({
          orderBy: { created_at: 'desc' },
          take: 6,
          select: {
            id: true,
            type: true,
            url: true,
            title: true,
            description: true,
            tournament_id: true,
          },
        }),
      ]);

    return {
      tournaments,
      liveMatches,
      recentMatches,
      upcomingMatches,
      announcements,
      featuredMedia,
    };
  }

  getLiveMatches(divisionId?: string) {
    return this.matchesService.findAll({
      status: 'LIVE',
      divisionId,
      limit: 20,
    });
  }

  resolveDivisionSlug(divisionSlug: string) {
    return this.divisionsService.findBySlugGlobal(divisionSlug);
  }
}
