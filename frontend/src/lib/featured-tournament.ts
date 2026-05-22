import type { Tournament } from '@/types';

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

