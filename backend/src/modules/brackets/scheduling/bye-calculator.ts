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
