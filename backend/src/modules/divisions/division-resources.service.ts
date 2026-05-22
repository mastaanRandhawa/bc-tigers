import { Injectable } from '@nestjs/common';
import type { MatchStatus } from '@prisma/client';
import { DivisionsService } from './divisions.service';
import { TeamsService } from '../teams/teams.service';
import { PlayersService } from '../players/players.service';
import { MatchesService } from '../matches/matches.service';
import { StandingsService } from '../standings/standings.service';
import { StatsService } from '../stats/stats.service';
import { BracketsService } from '../brackets/brackets.service';
import { VenuesService } from '../venues/venues.service';

@Injectable()
export class DivisionResourcesService {
  constructor(
    private readonly divisionsService: DivisionsService,
    private readonly teamsService: TeamsService,
    private readonly playersService: PlayersService,
    private readonly matchesService: MatchesService,
    private readonly standingsService: StandingsService,
    private readonly statsService: StatsService,
    private readonly bracketsService: BracketsService,
    private readonly venuesService: VenuesService,
  ) {}

  private async resolveDivisionId(tournamentSlug: string, divisionSlug: string) {
    const division = await this.divisionsService.resolveDivision(
      tournamentSlug,
      divisionSlug,
    );
    return division.id;
  }

  async getTeams(tournamentSlug: string, divisionSlug: string) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.teamsService.findAll({ divisionId });
  }

  async getTeam(
    tournamentSlug: string,
    divisionSlug: string,
    teamSlug: string,
  ) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.teamsService.findOneInDivision(divisionId, teamSlug);
  }

  async getPlayer(
    tournamentSlug: string,
    divisionSlug: string,
    teamSlug: string,
    playerId: string,
  ) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    const team = await this.teamsService.findOneInDivision(divisionId, teamSlug);
    return this.playersService.findOneOnTeam(team.id, playerId);
  }

  async getSchedule(
    tournamentSlug: string,
    divisionSlug: string,
    params?: { status?: string },
  ) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.matchesService.findAll({
      divisionId,
      status: params?.status as MatchStatus | undefined,
      limit: 200,
    });
  }

  async getPlayers(tournamentSlug: string, divisionSlug: string) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.playersService.findByDivision(divisionId);
  }

  async getMatches(
    tournamentSlug: string,
    divisionSlug: string,
    params?: { status?: string; page?: number; limit?: number },
  ) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.matchesService.findAll({
      divisionId,
      status: params?.status as MatchStatus | undefined,
      page: params?.page,
      limit: params?.limit ?? 100,
    });
  }

  async getStandings(tournamentSlug: string, divisionSlug: string) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.standingsService.getByDivision(divisionId);
  }

  async getTopScorers(
    tournamentSlug: string,
    divisionSlug: string,
    limit?: number,
  ) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.statsService.topScorers({ divisionId, limit });
  }

  async getTopAssists(
    tournamentSlug: string,
    divisionSlug: string,
    limit?: number,
  ) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.statsService.topAssists({ divisionId, limit });
  }

  async getDiscipline(
    tournamentSlug: string,
    divisionSlug: string,
    limit?: number,
  ) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.statsService.discipline({ divisionId, limit });
  }

  async getBracket(tournamentSlug: string, divisionSlug: string) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.bracketsService.getByDivisionId(divisionId);
  }

  async getVenues(tournamentSlug: string, divisionSlug: string) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.venuesService.findByDivision(divisionId);
  }

  async getVenue(
    tournamentSlug: string,
    divisionSlug: string,
    venueSlug: string,
  ) {
    const divisionId = await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.venuesService.findOneInDivision(divisionId, venueSlug);
  }
}
