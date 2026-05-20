import type { Division, Match, Tournament } from '@/types';
import {
  getDivisionMatchesPath,
  getDivisionSchedulePath,
} from '@/lib/division-routes';

export const FEATURED_TOURNAMENT_SLUG = 'miri-piri-2026';

export function pickFeaturedTournament(
  tournaments: Tournament[],
): Tournament | undefined {
  return (
    tournaments.find((t) => t.slug === FEATURED_TOURNAMENT_SLUG) ??
    tournaments.find((t) => t.status === 'UPCOMING') ??
    tournaments.find((t) => t.status === 'ACTIVE') ??
    tournaments[0]
  );
}

export function tournamentOverviewPath(tournament?: Tournament | null) {
  return tournament?.slug ? `/tournaments/${tournament.slug}` : '/tournaments';
}

function divisionPathFromMatch(
  match: Match | undefined,
  kind: 'schedule' | 'matches',
): string | null {
  const division = match?.division;
  const tournamentSlug = division?.tournament?.slug;
  const divisionSlug = division?.slug;
  if (!tournamentSlug || !divisionSlug || !division) return null;

  const withTournament = { ...division, tournament: division.tournament } as Division;
  return kind === 'schedule'
    ? getDivisionSchedulePath(withTournament)
    : getDivisionMatchesPath(withTournament);
}

/** Prefer a path tied to real fixtures; otherwise tournament overview. */
export function hubSchedulePath(tournament: Tournament | undefined, upcoming: Match[]) {
  return (
    divisionPathFromMatch(upcoming[0], 'schedule') ??
    tournamentOverviewPath(tournament)
  );
}

export function hubMatchesPath(
  tournament: Tournament | undefined,
  live: Match[],
  recent: Match[],
) {
  return (
    divisionPathFromMatch(live[0], 'matches') ??
    divisionPathFromMatch(recent[0], 'matches') ??
    tournamentOverviewPath(tournament)
  );
}
