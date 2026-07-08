/** Smallest power of 2 >= n (minimum bracket size 2). */
export function nextPowerOfTwo(n: number): number {
  if (n <= 2) return 2;
  let size = 2;
  while (size < n) size *= 2;
  return size;
}

export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

export function bracketSizeForTeamCount(teamCount: number): number {
  return nextPowerOfTwo(Math.max(teamCount, 2));
}

export function byeCountForTeamCount(teamCount: number): number {
  const size = bracketSizeForTeamCount(teamCount);
  return size - teamCount;
}

/** Max teams supported by current BracketStage enum (ROUND_OF_16 = 16 slots). */
export const MAX_SUPPORTED_TEAMS = 16;

export const VALID_BRACKET_SIZES = [2, 4, 8, 16] as const;
export type ValidBracketSize = (typeof VALID_BRACKET_SIZES)[number];

export function isValidBracketSize(size: number): size is ValidBracketSize {
  return (VALID_BRACKET_SIZES as readonly number[]).includes(size);
}
