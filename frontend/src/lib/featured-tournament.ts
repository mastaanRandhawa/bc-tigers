import type { Division, Match, Tournament } from '@/types';
import {
  getDivisionMatchesPath,
  getDivisionSchedulePath,
} from '@/lib/division-routes';

function tournamentStartMs(t: Tournament) {
  return new Date(t.start_date).getTime();
}

function tournamentEndMs(t: Tournament) {
  return new Date(t.end_date).getTime();
}

function bySoonestStart(a: Tournament, b: Tournament) {
  return tournamentStartMs(a) - tournamentStartMs(b);
}

function bySoonestEnd(a: Tournament, b: Tournament) {
  return tournamentEndMs(a) - tournamentEndMs(b);
}

/** Primary tournament for home hero and hub deep-links (from API data only). */
export function pickFeaturedTournament(
  tournaments: Tournament[],
): Tournament | undefined {
  if (tournaments.length === 0) return undefined;

  const active = tournaments
    .filter((t) => t.status === 'ACTIVE')
    .sort(bySoonestEnd);
  if (active.length > 0) return active[0];

  const upcoming = tournaments
    .filter((t) => t.status === 'UPCOMING')
    .sort(bySoonestStart);
  if (upcoming.length > 0) return upcoming[0];

  return tournaments[0];
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
