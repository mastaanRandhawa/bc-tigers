import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { queryTiming } from '@/lib/query-options';
import { tournamentResourcesService } from '@/services/tournament-resources.service';

function enabled(tournamentSlug?: string) {
  return !!tournamentSlug;
}

export function useTournamentMatches(
  tournamentSlug?: string,
  params?: { status?: string; limit?: number },
) {
  return useQuery({
    queryKey: queryKeys.tournaments.resources.matches(tournamentSlug ?? '', params ?? {}),
    queryFn: async () =>
      (await tournamentResourcesService.getMatches(tournamentSlug!, params)).data,
    enabled: enabled(tournamentSlug),
    ...queryTiming.feed,
  });
}

export function useTournamentStandingsResource(tournamentSlug?: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.resources.standings(tournamentSlug ?? ''),
    queryFn: async () =>
      (await tournamentResourcesService.getStandings(tournamentSlug!)).data,
    enabled: enabled(tournamentSlug),
    ...queryTiming.feed,
  });
}

export function useTournamentVenuesResource(tournamentSlug?: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.resources.venues(tournamentSlug ?? ''),
    queryFn: async () =>
      (await tournamentResourcesService.getVenues(tournamentSlug!)).data,
    enabled: enabled(tournamentSlug),
    ...queryTiming.feed,
  });
}

export function useTournamentMediaResource(tournamentSlug?: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.tournaments.resources.media(tournamentSlug ?? '', limit),
    queryFn: async () =>
      (await tournamentResourcesService.getMedia(tournamentSlug!, limit)).data,
    enabled: enabled(tournamentSlug),
    ...queryTiming.feed,
  });
}

export function useTournamentAnnouncements(tournamentSlug?: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.tournaments.resources.announcements(tournamentSlug ?? '', limit),
    queryFn: async () =>
      (await tournamentResourcesService.getAnnouncements(tournamentSlug!, limit)).data,
    enabled: enabled(tournamentSlug),
    ...queryTiming.feed,
  });
}

export function useTournamentTopScorersResource(tournamentSlug?: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.tournaments.resources.topScorers(tournamentSlug ?? '', limit),
    queryFn: async () =>
      (await tournamentResourcesService.getTopScorers(tournamentSlug!, limit)).data,
    enabled: enabled(tournamentSlug),
    ...queryTiming.feed,
  });
}
