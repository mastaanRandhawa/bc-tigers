import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { divisionResourcesService } from '@/services/division-resources.service';
import { hubService } from '@/services/hub.service';
import type { Division } from '@/types';

function enabled(tournamentSlug?: string, divisionSlug?: string) {
  return !!tournamentSlug && !!divisionSlug;
}

export function useDivisionLookup(divisionSlug?: string) {
  return useQuery({
    queryKey: queryKeys.divisions.bySlugGlobal(divisionSlug ?? ''),
    queryFn: async () => (await hubService.resolveDivision(divisionSlug!)).data,
    enabled: !!divisionSlug,
  });
}

export function useDivisionTeams(tournamentSlug?: string, divisionSlug?: string) {
  return useQuery({
    queryKey: queryKeys.divisions.resources.teams(tournamentSlug ?? '', divisionSlug ?? ''),
    queryFn: async () =>
      (await divisionResourcesService.getTeams(tournamentSlug!, divisionSlug!)).data,
    enabled: enabled(tournamentSlug, divisionSlug),
  });
}

export function useDivisionTeam(
  tournamentSlug?: string,
  divisionSlug?: string,
  teamSlug?: string,
) {
  return useQuery({
    queryKey: queryKeys.divisions.resources.team(
      tournamentSlug ?? '',
      divisionSlug ?? '',
      teamSlug ?? '',
    ),
    queryFn: async () =>
      (await divisionResourcesService.getTeam(tournamentSlug!, divisionSlug!, teamSlug!)).data,
    enabled: enabled(tournamentSlug, divisionSlug) && !!teamSlug,
  });
}

export function useDivisionPlayers(tournamentSlug?: string, divisionSlug?: string) {
  return useQuery({
    queryKey: queryKeys.divisions.resources.players(tournamentSlug ?? '', divisionSlug ?? ''),
    queryFn: async () =>
      (await divisionResourcesService.getPlayers(tournamentSlug!, divisionSlug!)).data,
    enabled: enabled(tournamentSlug, divisionSlug),
  });
}

export function useDivisionMatches(
  tournamentSlug?: string,
  divisionSlug?: string,
  params?: { status?: string },
) {
  return useQuery({
    queryKey: queryKeys.divisions.resources.matches(
      tournamentSlug ?? '',
      divisionSlug ?? '',
      params,
    ),
    queryFn: async () =>
      (await divisionResourcesService.getMatches(tournamentSlug!, divisionSlug!, {
        ...params,
        limit: 200,
      })).data,
    enabled: enabled(tournamentSlug, divisionSlug),
  });
}

export function useDivisionStandingsResource(tournamentSlug?: string, divisionSlug?: string) {
  return useQuery({
    queryKey: queryKeys.divisions.resources.standings(tournamentSlug ?? '', divisionSlug ?? ''),
    queryFn: async () =>
      (await divisionResourcesService.getStandings(tournamentSlug!, divisionSlug!)).data,
    enabled: enabled(tournamentSlug, divisionSlug),
  });
}

export function useDivisionBracketResource(tournamentSlug?: string, divisionSlug?: string) {
  return useQuery({
    queryKey: queryKeys.divisions.resources.bracket(tournamentSlug ?? '', divisionSlug ?? ''),
    queryFn: async () =>
      (await divisionResourcesService.getBracket(tournamentSlug!, divisionSlug!)).data,
    enabled: enabled(tournamentSlug, divisionSlug),
  });
}

export function useDivisionVenues(tournamentSlug?: string, divisionSlug?: string) {
  return useQuery({
    queryKey: queryKeys.divisions.resources.venues(tournamentSlug ?? '', divisionSlug ?? ''),
    queryFn: async () =>
      (await divisionResourcesService.getVenues(tournamentSlug!, divisionSlug!)).data,
    enabled: enabled(tournamentSlug, divisionSlug),
  });
}

export function useDivisionVenue(
  tournamentSlug?: string,
  divisionSlug?: string,
  venueSlug?: string,
) {
  return useQuery({
    queryKey: queryKeys.divisions.resources.venue(
      tournamentSlug ?? '',
      divisionSlug ?? '',
      venueSlug ?? '',
    ),
    queryFn: async () =>
      (await divisionResourcesService.getVenue(tournamentSlug!, divisionSlug!, venueSlug!)).data,
    enabled: enabled(tournamentSlug, divisionSlug) && !!venueSlug,
  });
}

export type DivisionRouteContext = {
  division: Division;
  tournamentSlug: string;
  divisionSlug: string;
  basePath: string;
};
