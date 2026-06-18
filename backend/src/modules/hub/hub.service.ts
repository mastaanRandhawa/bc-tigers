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
    const [tournaments, liveMatches, recentMatches, upcomingMatches, announcements] =
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
        prisma.announcement.findMany({
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
      ]);

    return {
      tournaments,
      liveMatches,
      recentMatches,
      upcomingMatches,
      announcements,
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

  async search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { tournaments: [], divisions: [], teams: [] };
    }

    const [tournaments, divisions, teams] = await Promise.all([
      prisma.tournament.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 8,
        select: { id: true, name: true, slug: true, location: true, status: true },
      }),
      prisma.division.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        take: 8,
        include: { tournament: { select: { slug: true, name: true } } },
      }),
      prisma.team.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 12,
        include: {
          division: {
            include: { tournament: { select: { slug: true, name: true } } },
          },
        },
      }),
    ]);

    return {
      tournaments,
      divisions: divisions.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        tournament_slug: d.tournament.slug,
        tournament_name: d.tournament.name,
      })),
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        city: t.city,
        division_slug: t.division.slug,
        tournament_slug: t.division.tournament.slug,
      })),
    };
  }
}
