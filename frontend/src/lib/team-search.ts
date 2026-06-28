export interface SearchableTeamOption {
  id: string;
  name: string;
  division: {
    id?: string;
    name: string;
    tournament?: { name: string };
  };
}

export function teamHaystack(team: SearchableTeamOption): string {
  return [team.name, team.division.name, team.division.tournament?.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function groupTeamsByDivision<T extends SearchableTeamOption>(
  teams: T[],
): { id: string; label: string; teams: T[] }[] {
  const map = new Map<string, { id: string; label: string; teams: T[] }>();
  for (const t of teams) {
    const divisionId = t.division.id ?? t.division.name;
    const label = t.division.tournament?.name
      ? `${t.division.name} · ${t.division.tournament.name}`
      : t.division.name;
    if (!map.has(divisionId)) map.set(divisionId, { id: divisionId, label, teams: [] });
    map.get(divisionId)!.teams.push(t);
  }
  return [...map.values()];
}
