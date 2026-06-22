import type { EligibleTeam } from './types';

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

/** Random team order for bracket shuffle (first-round placement). */
export function shuffleTeamIds(
  teams: EligibleTeam[],
  randomSeed: number = Date.now(),
): string[] {
  const ids = teams.map((t) => t.id);
  return shuffleWithSeed(ids, randomSeed);
}
