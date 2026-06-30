import type { MatchSlotOutcome } from '@prisma/client';

/**
 * Pure presentation helpers for unresolved match placeholder slots. A slot with
 * no real team yet shows a human label describing where its team will come from:
 * the winner/loser of a specific game, or a standings position.
 */

/**
 * Human label for an unresolved match-source slot, e.g. "Winner of Game 5" or,
 * when the source has no game number yet, "Winner of TBD". Returns null when the
 * slot has no match source.
 */
export function slotLabel(
  outcome: MatchSlotOutcome | null,
  source: { round: number | null } | null,
): string | null {
  if (!outcome || !source) return null;
  const verb = outcome === 'WINNER' ? 'Winner' : 'Loser';
  const of = source.round != null ? `Game ${source.round}` : 'TBD';
  return `${verb} of ${of}`;
}

/** English ordinal for a 1-based rank: 1 → "1st", 2 → "2nd", 3 → "3rd", 11 → "11th". */
export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  const suffix = ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/**
 * Human label for an unresolved positional slot: "Pool A 1st" when the rank is
 * drawn from a group, or a whole-division "1st" when it is not. Null when the
 * slot has no positional source.
 */
export function positionalLabel(
  group: { name: string } | null | undefined,
  rank: number | null,
): string | null {
  if (rank == null) return null;
  return group ? `${group.name} ${ordinal(rank)}` : ordinal(rank);
}

/**
 * Adds `home_label`/`away_label` placeholder text for unresolved slots — either
 * a match source ("Winner of Game 5") or a standings position ("Pool A 1st").
 * A slot with a real team gets a null label.
 */
export function attachSlotLabels<
  T extends {
    home_source_outcome: MatchSlotOutcome | null;
    away_source_outcome: MatchSlotOutcome | null;
    home_source?: { round: number | null } | null;
    away_source?: { round: number | null } | null;
    home_source_rank?: number | null;
    away_source_rank?: number | null;
    home_source_group?: { name: string } | null;
    away_source_group?: { name: string } | null;
    home_team?: unknown;
    away_team?: unknown;
  },
>(match: T): T & { home_label: string | null; away_label: string | null } {
  return {
    ...match,
    home_label: match.home_team
      ? null
      : slotLabel(match.home_source_outcome, match.home_source ?? null) ??
        positionalLabel(match.home_source_group, match.home_source_rank ?? null),
    away_label: match.away_team
      ? null
      : slotLabel(match.away_source_outcome, match.away_source ?? null) ??
        positionalLabel(match.away_source_group, match.away_source_rank ?? null),
  };
}
