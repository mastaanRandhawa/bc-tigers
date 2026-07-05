import type { Match, MatchStatus } from '@/types';

export type MatchListFilters = {
  status: 'all' | MatchStatus;
  tournamentId: string;
  divisionId: string;
  venueId: string;
};

export const DEFAULT_MATCH_LIST_FILTERS: MatchListFilters = {
  status: 'all',
  tournamentId: 'all',
  divisionId: 'all',
  venueId: 'all',
};

export function matchListFiltersKey(filters: MatchListFilters) {
  return `${filters.status}:${filters.tournamentId}:${filters.divisionId}:${filters.venueId}`;
}

export function hasActiveMatchListFilters(filters: MatchListFilters) {
  return (
    filters.status !== 'all' ||
    filters.tournamentId !== 'all' ||
    filters.divisionId !== 'all' ||
    filters.venueId !== 'all'
  );
}

export function filterMatches(matches: Match[], filters: MatchListFilters): Match[] {
  return matches.filter((match) => {
    if (filters.status !== 'all' && match.status !== filters.status) return false;
    if (filters.tournamentId !== 'all' && match.tournament_id !== filters.tournamentId) {
      return false;
    }
    if (filters.divisionId !== 'all' && match.division_id !== filters.divisionId) {
      return false;
    }
    if (filters.venueId !== 'all' && match.venue_id !== filters.venueId) return false;
    return true;
  });
}

export function uniqueTournamentsFromMatches(matches: Match[]) {
  const map = new Map<string, string>();
  for (const match of matches) {
    if (match.tournament_id && match.tournament?.name) {
      map.set(match.tournament_id, match.tournament.name);
    }
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function uniqueDivisionsFromMatches(
  matches: Match[],
  tournamentId = 'all',
) {
  const map = new Map<string, string>();
  for (const match of matches) {
    if (tournamentId !== 'all' && match.tournament_id !== tournamentId) continue;
    if (match.division_id && match.division?.name) {
      map.set(match.division_id, match.division.name);
    }
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function uniqueVenuesFromMatches(matches: Match[]) {
  const map = new Map<string, string>();
  for (const match of matches) {
    if (match.venue_id && match.venue?.name) {
      map.set(match.venue_id, match.venue.name);
    }
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
