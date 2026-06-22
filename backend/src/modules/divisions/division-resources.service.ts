import { Injectable } from '@nestjs/common';
import type { MatchStatus } from '@prisma/client';
import { DivisionsService } from './divisions.service';
import { TeamsService } from '../teams/teams.service';
import { TeamPlayersService } from '../teams/team-players.service';
import { MatchesService } from '../matches/matches.service';
import { StandingsService } from '../standings/standings.service';
import { BracketsService } from '../brackets/brackets.service';
import { VenuesService } from '../venues/venues.service';

@Injectable()
export class DivisionResourcesService {
  constructor(
    private readonly divisionsService: DivisionsService,
    private readonly teamsService: TeamsService,
    private readonly teamPlayersService: TeamPlayersService,
    private readonly matchesService: MatchesService,
    private readonly standingsService: StandingsService,
    private readonly bracketsService: BracketsService,
    private readonly venuesService: VenuesService,
  ) {}

  private async resolveDivisionId(
    tournamentSlug: string,
    divisionSlug: string,
  ) {
    const division = await this.divisionsService.resolveDivision(
      tournamentSlug,
      divisionSlug,
    );
    return division.id;
  }

  async getTeams(tournamentSlug: string, divisionSlug: string) {
    const divisionId = await this.resolveDivisionId(
      tournamentSlug,
      divisionSlug,
    );
    return this.teamsService.findAll({ divisionId });
  }

  async getTeam(
    tournamentSlug: string,
    divisionSlug: string,
    teamSlug: string,
  ) {
    const divisionId = await this.resolveDivisionId(
      tournamentSlug,
      divisionSlug,
    );
    return this.teamsService.findOneInDivision(divisionId, teamSlug);
  }

  async getPlayers(tournamentSlug: string, divisionSlug: string) {
    const divisionId = await this.resolveDivisionId(
      tournamentSlug,
      divisionSlug,
    );
    return this.teamPlayersService.findByDivision(divisionId);
  }

  async getMatches(
    tournamentSlug: string,
    divisionSlug: string,
    params?: { status?: string; page?: number; limit?: number },
  ) {
    const divisionId = await this.resolveDivisionId(
      tournamentSlug,
      divisionSlug,
    );
    return this.matchesService.findAll({
      divisionId,
      status: params?.status as MatchStatus | undefined,
      page: params?.page,
      limit: params?.limit ?? 100,
    });
  }

  async getStandings(tournamentSlug: string, divisionSlug: string) {
    const divisionId = await this.resolveDivisionId(
      tournamentSlug,
      divisionSlug,
    );
    return this.standingsService.getByDivision(divisionId);
  }

  async getBracket(tournamentSlug: string, divisionSlug: string) {
    const divisionId = await this.resolveDivisionId(
      tournamentSlug,
      divisionSlug,
    );
    return this.bracketsService.getByDivisionId(divisionId);
  }

  async getVenues(tournamentSlug: string, divisionSlug: string) {
    await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.venuesService.findAll();
  }

  async getVenue(
    tournamentSlug: string,
    divisionSlug: string,
    venueSlug: string,
  ) {
    await this.resolveDivisionId(tournamentSlug, divisionSlug);
    return this.venuesService.findOne(venueSlug);
  }
}
