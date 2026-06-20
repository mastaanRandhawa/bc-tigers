/**
 * Deterministic helpers for the configurable "coin toss" / random selection
 * tiebreaker. Determinism keyed on a seed keeps standings reproducible and
 * testable; swap the seed per tournament for an unpredictable but auditable
 * draw.
 */

/** Mix a string into a 32-bit hash (FNV-1a style) combined with a seed. */
export function seededHash(value: string, seed: number): number {
  let hash = (2166136261 ^ (seed >>> 0)) >>> 0;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Total order over team ids derived purely from the seed, independent of input
 * order. A team earlier in the returned list "wins" the toss.
 */
export function coinTossOrder(teamIds: string[], seed: number): string[] {
  return [...teamIds].sort((a, b) => {
    const ha = seededHash(a, seed);
    const hb = seededHash(b, seed);
    if (ha !== hb) return ha - hb;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

/** Compare two teams by the seeded coin toss (negative = `a` wins). */
export function compareCoinToss(a: string, b: string, seed: number): number {
  const ha = seededHash(a, seed);
  const hb = seededHash(b, seed);
  if (ha !== hb) return ha - hb;
  return a < b ? -1 : a > b ? 1 : 0;
}
