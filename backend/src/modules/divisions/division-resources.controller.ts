import { Controller, Get, Param, Query } from '@nestjs/common';
import { DivisionResourcesService } from './division-resources.service';

@Controller('tournaments/:tournamentSlug/divisions/:divisionSlug')
export class DivisionResourcesController {
  constructor(private readonly service: DivisionResourcesService) {}

  @Get('teams')
  getTeams(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
  ) {
    return this.service.getTeams(tournamentSlug, divisionSlug);
  }

  @Get('teams/:teamSlug')
  getTeam(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
    @Param('teamSlug') teamSlug: string,
  ) {
    return this.service.getTeam(tournamentSlug, divisionSlug, teamSlug);
  }

  @Get('teams/:teamSlug/players/:playerId')
  getPlayer(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('playerId') playerId: string,
  ) {
    return this.service.getPlayer(
      tournamentSlug,
      divisionSlug,
      teamSlug,
      playerId,
    );
  }

  @Get('schedule')
  getSchedule(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
    @Query('status') status?: string,
  ) {
    return this.service.getSchedule(tournamentSlug, divisionSlug, { status });
  }

  @Get('players')
  getPlayers(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
  ) {
    return this.service.getPlayers(tournamentSlug, divisionSlug);
  }

  @Get('matches')
  getMatches(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMatches(tournamentSlug, divisionSlug, {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('standings')
  getStandings(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
  ) {
    return this.service.getStandings(tournamentSlug, divisionSlug);
  }

  @Get('stats/top-scorers')
  getTopScorers(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getTopScorers(
      tournamentSlug,
      divisionSlug,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('stats/top-assists')
  getTopAssists(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getTopAssists(
      tournamentSlug,
      divisionSlug,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('stats/discipline')
  getDiscipline(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getDiscipline(
      tournamentSlug,
      divisionSlug,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('bracket')
  getBracket(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
  ) {
    return this.service.getBracket(tournamentSlug, divisionSlug);
  }

  @Get('venues')
  getVenues(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
  ) {
    return this.service.getVenues(tournamentSlug, divisionSlug);
  }

  @Get('venues/:venueSlug')
  getVenue(
    @Param('tournamentSlug') tournamentSlug: string,
    @Param('divisionSlug') divisionSlug: string,
    @Param('venueSlug') venueSlug: string,
  ) {
    return this.service.getVenue(tournamentSlug, divisionSlug, venueSlug);
  }
}
