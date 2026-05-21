import { Injectable } from '@nestjs/common';
import type { MatchStatus } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { TournamentsService } from './tournaments.service';
import { MatchesService } from '../matches/matches.service';
import { StatsService } from '../stats/stats.service';
import { VenuesService } from '../venues/venues.service';

@Injectable()
export class TournamentResourcesService {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly matchesService: MatchesService,
    private readonly statsService: StatsService,
    private readonly venuesService: VenuesService,
  ) {}

  private async resolveTournament(slug: string) {
    return this.tournamentsService.findOne(slug);
  }

  async getDivisions(tournamentSlug: string) {
    const tournament = await this.resolveTournament(tournamentSlug);
    return tournament.divisions;
  }

  async getMatches(
    tournamentSlug: string,
    params?: { status?: string; page?: number; limit?: number },
  ) {
    const tournament = await this.resolveTournament(tournamentSlug);
    return this.matchesService.findAll({
      tournamentId: tournament.id,
      status: params?.status as MatchStatus | undefined,
      page: params?.page,
      limit: params?.limit ?? 100,
    });
  }

  async getStandings(tournamentSlug: string) {
    const tournament = await this.resolveTournament(tournamentSlug);
    const divisionIds = tournament.divisions.map((d) => d.id);
    if (divisionIds.length === 0) return [];

    return prisma.standing.findMany({
      where: { division_id: { in: divisionIds } },
      include: {
        team: true,
        division: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ division_id: 'asc' }, { points: 'desc' }, { goal_difference: 'desc' }],
    });
  }

  async getVenues(tournamentSlug: string) {
    const tournament = await this.resolveTournament(tournamentSlug);
    const divisionIds = tournament.divisions.map((d) => d.id);
    if (divisionIds.length === 0) return [];

    const matches = await prisma.match.findMany({
      where: { division_id: { in: divisionIds }, venue_id: { not: null } },
      select: { venue_id: true },
      distinct: ['venue_id'],
    });

    const venueIds = matches
      .map((m) => m.venue_id)
      .filter((id): id is string => id != null);

    if (venueIds.length === 0) return this.venuesService.findAll();

    return prisma.venue.findMany({
      where: { id: { in: venueIds } },
      include: { fields: true },
      orderBy: { name: 'asc' },
    });
  }

  async getMedia(tournamentSlug: string, limit = 24) {
    const tournament = await this.resolveTournament(tournamentSlug);
    return prisma.media.findMany({
      where: { tournament_id: tournament.id },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async getAnnouncements(tournamentSlug: string, limit = 10) {
    const tournament = await this.resolveTournament(tournamentSlug);
    return prisma.notification.findMany({
      where: {
        OR: [{ tournament_id: tournament.id }, { tournament_id: null, user_id: null }],
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        created_at: true,
        tournament_id: true,
      },
    });
  }

  async getTopScorers(tournamentSlug: string, limit = 10) {
    const tournament = await this.resolveTournament(tournamentSlug);
    return this.statsService.topScorers({ tournamentId: tournament.id, limit });
  }
}
