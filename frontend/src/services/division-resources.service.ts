import apiClient from '@/lib/api-client';
import type { BracketNode, Match, Player, Standing, Team, Venue } from '@/types';

function base(tournamentSlug: string, divisionSlug: string) {
  return `/tournaments/${tournamentSlug}/divisions/${divisionSlug}`;
}

export const divisionResourcesService = {
  getTeams: (tournamentSlug: string, divisionSlug: string) =>
    apiClient.get<Team[]>(`${base(tournamentSlug, divisionSlug)}/teams`),

  getTeam: (tournamentSlug: string, divisionSlug: string, teamSlug: string) =>
    apiClient.get<Team>(`${base(tournamentSlug, divisionSlug)}/teams/${teamSlug}`),

  getPlayer: (
    tournamentSlug: string,
    divisionSlug: string,
    teamSlug: string,
    playerId: string,
  ) =>
    apiClient.get<Player>(
      `${base(tournamentSlug, divisionSlug)}/teams/${teamSlug}/players/${playerId}`,
    ),

  getSchedule: (
    tournamentSlug: string,
    divisionSlug: string,
    params?: { status?: string },
  ) =>
    apiClient.get<Match[]>(`${base(tournamentSlug, divisionSlug)}/schedule`, { params }),

  getPlayers: (tournamentSlug: string, divisionSlug: string) =>
    apiClient.get<Player[]>(`${base(tournamentSlug, divisionSlug)}/players`),

  getMatches: (
    tournamentSlug: string,
    divisionSlug: string,
    params?: { status?: string; page?: number; limit?: number },
  ) => apiClient.get<Match[]>(`${base(tournamentSlug, divisionSlug)}/matches`, { params }),

  getStandings: (tournamentSlug: string, divisionSlug: string) =>
    apiClient.get<Standing[]>(`${base(tournamentSlug, divisionSlug)}/standings`),

  getBracket: (tournamentSlug: string, divisionSlug: string) =>
    apiClient.get<BracketNode[]>(`${base(tournamentSlug, divisionSlug)}/bracket`),

  getVenues: (tournamentSlug: string, divisionSlug: string) =>
    apiClient.get<Venue[]>(`${base(tournamentSlug, divisionSlug)}/venues`),

  getVenue: (tournamentSlug: string, divisionSlug: string, venueSlug: string) =>
    apiClient.get<Venue>(`${base(tournamentSlug, divisionSlug)}/venues/${venueSlug}`),
};
