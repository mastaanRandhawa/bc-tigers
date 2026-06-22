import type { Tournament } from '@/types';
import { compareDates } from '@/lib/date';

function bySoonestStart(a: Tournament, b: Tournament) {
  return compareDates(a.start_date, b.start_date);
}

function bySoonestEnd(a: Tournament, b: Tournament) {
  return compareDates(a.end_date, b.end_date);
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

