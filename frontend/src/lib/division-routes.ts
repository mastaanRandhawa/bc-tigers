import type { Division } from '@/types';

export function divisionBasePath(tournamentSlug: string, divisionSlug: string) {
  return `/tournaments/${tournamentSlug}/divisions/${divisionSlug}`;
}

export function divisionTeamsPath(tournamentSlug: string, divisionSlug: string) {
  return `${divisionBasePath(tournamentSlug, divisionSlug)}/teams`;
}

export function divisionTeamPath(
  tournamentSlug: string,
  divisionSlug: string,
  teamSlug: string,
) {
  return `${divisionTeamsPath(tournamentSlug, divisionSlug)}/${teamSlug}`;
}

export function divisionPlayersPath(tournamentSlug: string, divisionSlug: string) {
  return `${divisionBasePath(tournamentSlug, divisionSlug)}/players`;
}

export function divisionSchedulePath(tournamentSlug: string, divisionSlug: string) {
  return `${divisionBasePath(tournamentSlug, divisionSlug)}/schedule`;
}

export function divisionMatchesPath(tournamentSlug: string, divisionSlug: string) {
  return `${divisionBasePath(tournamentSlug, divisionSlug)}/matches`;
}

export function divisionMatchPath(
  tournamentSlug: string,
  divisionSlug: string,
  matchId: string,
) {
  return `${divisionMatchesPath(tournamentSlug, divisionSlug)}/${matchId}`;
}

export function divisionStandingsPath(tournamentSlug: string, divisionSlug: string) {
  return `${divisionBasePath(tournamentSlug, divisionSlug)}/standings`;
}

export function divisionStatsPath(tournamentSlug: string, divisionSlug: string) {
  return `${divisionBasePath(tournamentSlug, divisionSlug)}/stats`;
}

export function divisionBracketsPath(tournamentSlug: string, divisionSlug: string) {
  return `${divisionBasePath(tournamentSlug, divisionSlug)}/brackets`;
}

export function divisionVenuesPath(tournamentSlug: string, divisionSlug: string) {
  return `${divisionBasePath(tournamentSlug, divisionSlug)}/venues`;
}

export function getDivisionBasePath(division: Division) {
  const tournamentSlug = division.tournament?.slug;
  if (!tournamentSlug) return null;
  return divisionBasePath(tournamentSlug, division.slug);
}

export function getDivisionStandingsPath(division: Division) {
  const tournamentSlug = division.tournament?.slug;
  if (!tournamentSlug) return null;
  return divisionStandingsPath(tournamentSlug, division.slug);
}

export function getDivisionSchedulePath(division: Division) {
  const tournamentSlug = division.tournament?.slug;
  if (!tournamentSlug) return null;
  return divisionSchedulePath(tournamentSlug, division.slug);
}

export function getDivisionBracketsPath(division: Division) {
  const tournamentSlug = division.tournament?.slug;
  if (!tournamentSlug) return null;
  return divisionBracketsPath(tournamentSlug, division.slug);
}

export function getDivisionTeamsPath(division: Division) {
  const tournamentSlug = division.tournament?.slug;
  if (!tournamentSlug) return null;
  return divisionTeamsPath(tournamentSlug, division.slug);
}

export function getDivisionTeamPath(division: Division, teamSlug: string) {
  const tournamentSlug = division.tournament?.slug;
  if (!tournamentSlug) return null;
  return divisionTeamPath(tournamentSlug, division.slug, teamSlug);
}

export function getDivisionVenuesPath(division: Division) {
  const tournamentSlug = division.tournament?.slug;
  if (!tournamentSlug) return null;
  return divisionVenuesPath(tournamentSlug, division.slug);
}
