import type { Division, Match, Player, Standing, Team, Tournament, Venue } from '@/types';

export function normalizeSearch(query: string) {
  return query.trim().toLowerCase();
}

export function textIncludes(haystack: string, query: string) {
  const q = normalizeSearch(query);
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}

export function joinSearchParts(parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export function tournamentSearchText(t: Tournament) {
  return joinSearchParts([t.name, t.location, t.description, t.status, t.tournament_type]);
}

export function divisionSearchText(d: Division) {
  return joinSearchParts([d.name, d.age_group, d.gender, d.format, d.tournament?.name]);
}

export function teamSearchText(t: Team) {
  return joinSearchParts([t.name, t.city, t.slug]);
}

export function venueSearchText(v: Venue) {
  return joinSearchParts([v.name, v.address, v.city, v.slug]);
}

export function playerSearchText(p: Player) {
  return joinSearchParts([
    p.first_name,
    p.last_name,
    p.preferred_position,
    String(p.jersey_number ?? ''),
  ]);
}

export function matchSearchText(m: Match) {
  return joinSearchParts([
    m.home_team?.name ?? m.home_label,
    m.away_team?.name ?? m.away_label,
    m.venue?.name,
    m.division?.name,
    m.tournament?.name,
    m.status,
    String(m.round ?? ''),
  ]);
}

export function standingSearchText(s: Standing) {
  return joinSearchParts([s.team?.name, s.team?.city]);
}
