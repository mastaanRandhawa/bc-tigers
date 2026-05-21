import { Controller, Get, Param, Query } from '@nestjs/common';
import { TournamentResourcesService } from './tournament-resources.service';

@Controller('tournaments/:tournamentSlug')
export class TournamentResourcesController {
  constructor(private readonly service: TournamentResourcesService) {}

  @Get('divisions')
  getDivisions(@Param('tournamentSlug') tournamentSlug: string) {
    return this.service.getDivisions(tournamentSlug);
  }

  @Get('matches')
  getMatches(
    @Param('tournamentSlug') tournamentSlug: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMatches(tournamentSlug, {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('standings')
  getStandings(@Param('tournamentSlug') tournamentSlug: string) {
    return this.service.getStandings(tournamentSlug);
  }

  @Get('venues')
  getVenues(@Param('tournamentSlug') tournamentSlug: string) {
    return this.service.getVenues(tournamentSlug);
  }

  @Get('media')
  getMedia(
    @Param('tournamentSlug') tournamentSlug: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMedia(
      tournamentSlug,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('announcements')
  getAnnouncements(
    @Param('tournamentSlug') tournamentSlug: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getAnnouncements(
      tournamentSlug,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('stats/top-scorers')
  getTopScorers(
    @Param('tournamentSlug') tournamentSlug: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getTopScorers(
      tournamentSlug,
      limit ? Number(limit) : undefined,
    );
  }
}
