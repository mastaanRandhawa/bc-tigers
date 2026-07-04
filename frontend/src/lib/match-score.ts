import type { Match } from '@/types';

type ScoreFields = Pick<
  Match,
  | 'home_score'
  | 'away_score'
  | 'home_penalties'
  | 'away_penalties'
  | 'tie_resolution'
>;

/** Small suffix for list/detail score lines, e.g. "(4–3 pens)". */
export function formatPenaltyShootoutSuffix(match: ScoreFields): string | null {
  if (match.tie_resolution !== 'PENALTIES') return null;
  if (match.home_score !== match.away_score) return null;
  const hp = match.home_penalties;
  const ap = match.away_penalties;
  if (hp == null || ap == null || hp === ap) return null;
  return `(${hp}–${ap} pens)`;
}
