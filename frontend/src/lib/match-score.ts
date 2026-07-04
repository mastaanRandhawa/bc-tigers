import type { Match } from '@/types';

type ScoreFields = Pick<
  Match,
  'home_score' | 'away_score' | 'home_penalties' | 'away_penalties'
>;

/** True when regulation is tied and penalty totals decide the outcome. */
export function hasDecisivePenaltyShootout(match: ScoreFields): boolean {
  if (match.home_score !== match.away_score) return false;
  const hp = match.home_penalties;
  const ap = match.away_penalties;
  return hp != null && ap != null && hp !== ap;
}

/** Small suffix for list/detail score lines, e.g. "(4–3 pens)". */
export function formatPenaltyShootoutSuffix(match: ScoreFields): string | null {
  if (!hasDecisivePenaltyShootout(match)) return null;
  return `(${match.home_penalties}–${match.away_penalties} pens)`;
}
