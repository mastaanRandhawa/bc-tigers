import { isPowerOfTwo } from './bye-calculator';

/**
 * Recursive standard bracket seed line order.
 * For size 8: [1,8,4,5,2,7,3,6] → matches (1v8), (4v5), (2v7), (3v6).
 */
export function standardSeedOrder(bracketSize: number): number[] {
  if (!isPowerOfTwo(bracketSize)) {
    throw new Error(`Bracket size must be a power of 2, got ${bracketSize}`);
  }
  if (bracketSize === 2) return [1, 2];

  const half = standardSeedOrder(bracketSize / 2);
  const result: number[] = [];
  for (const seed of half) {
    result.push(seed, bracketSize + 1 - seed);
  }
  return result;
}

export type SeedPair = [number, number];

export function standardSeedPairs(bracketSize: number): SeedPair[] {
  const order = standardSeedOrder(bracketSize);
  const pairs: SeedPair[] = [];
  for (let i = 0; i < order.length; i += 2) {
    pairs.push([order[i], order[i + 1]]);
  }
  return pairs;
}

export function buildFirstRoundSlots(
  teamIds: string[],
  bracketSize: number,
): Array<{ homeTeamId: string | null; awayTeamId: string | null; homeSeed: number; awaySeed: number }> {
  if (teamIds.length < 2) {
    throw new Error('Need at least 2 teams');
  }
  if (teamIds.length > bracketSize) {
    throw new Error(`Too many teams (${teamIds.length}) for bracket size ${bracketSize}`);
  }

  const unique = new Set(teamIds);
  if (unique.size !== teamIds.length) {
    throw new Error('Duplicate team IDs in input');
  }

  const pairs = standardSeedPairs(bracketSize);
  const used = new Set<string>();
  const slots: Array<{
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeSeed: number;
    awaySeed: number;
  }> = [];

  for (const [homeSeed, awaySeed] of pairs) {
    const homeTeamId =
      homeSeed <= teamIds.length ? teamIds[homeSeed - 1] : null;
    const awayTeamId =
      awaySeed <= teamIds.length ? teamIds[awaySeed - 1] : null;

    if (homeTeamId) {
      if (used.has(homeTeamId)) {
        throw new Error(`Team ${homeTeamId} would appear twice (seed ${homeSeed})`);
      }
      used.add(homeTeamId);
    }
    if (awayTeamId) {
      if (used.has(awayTeamId)) {
        throw new Error(`Team ${awayTeamId} would appear twice (seed ${awaySeed})`);
      }
      used.add(awayTeamId);
    }

    slots.push({ homeTeamId, awayTeamId, homeSeed, awaySeed });
  }

  if (used.size !== teamIds.length) {
    throw new Error(
      `Placement error: ${teamIds.length} teams provided but ${used.size} placed`,
    );
  }

  return slots;
}
