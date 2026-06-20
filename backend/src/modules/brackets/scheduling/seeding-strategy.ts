import type { BracketSeeding, EligibleTeam } from './types';

export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let state = seed >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function orderTeamsBySeeding(
  teams: EligibleTeam[],
  seeding: BracketSeeding,
  options?: { randomSeed?: number; rankedTeamIds?: string[] },
): string[] {
  switch (seeding) {
    case 'manual':
      return teams.map((t) => t.id);

    case 'alphabetical':
      return [...teams].sort((a, b) => a.name.localeCompare(b.name)).map((t) => t.id);

    case 'random': {
      const seed = options?.randomSeed ?? Date.now();
      const ids = teams.map((t) => t.id);
      return shuffleWithSeed(ids, seed);
    }

    case 'standard':
    default: {
      const ranked = options?.rankedTeamIds ?? [];
      const rankIndex = new Map(ranked.map((id, i) => [id, i]));
      return [...teams]
        .sort((a, b) => {
          const ra = rankIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
          const rb = rankIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
          if (ra !== rb) return ra - rb;
          return a.name.localeCompare(b.name);
        })
        .map((t) => t.id);
    }
  }
}
