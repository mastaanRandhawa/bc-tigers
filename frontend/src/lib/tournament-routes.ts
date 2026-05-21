import type { Match, Tournament } from '@/types';
import { divisionBasePath } from '@/lib/division-routes';

export function tournamentBasePath(slug: string) {
  return `/tournaments/${slug}`;
}

export function tournamentOverviewPath(slug: string) {
  return tournamentBasePath(slug);
}

export function tournamentDivisionsPath(slug: string) {
  return `${tournamentBasePath(slug)}/divisions`;
}

export function tournamentMatchesPath(slug: string) {
  return `${tournamentBasePath(slug)}/matches`;
}

export function tournamentStandingsPath(slug: string) {
  return `${tournamentBasePath(slug)}/standings`;
}

export function tournamentVenuesPath(slug: string) {
  return `${tournamentBasePath(slug)}/venues`;
}

export function tournamentMediaPath(slug: string) {
  return `${tournamentBasePath(slug)}/media`;
}

export function tournamentNewsPath(slug: string) {
  return `${tournamentBasePath(slug)}/news`;
}

export function tournamentSponsorsPath(slug: string) {
  return `${tournamentBasePath(slug)}/sponsors`;
}

export function tournamentRulesPath(slug: string) {
  return `${tournamentBasePath(slug)}/rules`;
}

export function getTournamentPath(tournament: Tournament) {
  return tournamentOverviewPath(tournament.slug);
}

export function getTournamentDivisionPath(
  tournamentSlug: string,
  divisionSlug: string,
) {
  return divisionBasePath(tournamentSlug, divisionSlug);
}

export function matchPath(matchId: string) {
  return `/matches/${matchId}`;
}

export function getTournamentPathFromMatch(match: Match): string {
  const slug = match.division?.tournament?.slug ?? match.tournament?.slug;
  return slug ? tournamentOverviewPath(slug) : '/tournaments';
}
