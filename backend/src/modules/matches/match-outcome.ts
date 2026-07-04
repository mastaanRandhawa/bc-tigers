import prisma from '../../prisma/prisma';
import { resolveKnockoutMatch } from '../../engine/knockout';
import { USFA_TOURNAMENT_CONFIG } from '../../engine/config';
import type { MatchResult } from '../../engine/types';

export type MatchOutcomeFields = {
  id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number;
  away_score: number;
  home_penalties?: number | null;
  away_penalties?: number | null;
};

/** Bracket-linked or feeding a Winner/Loser placeholder slot. */
export async function isEliminationMatch(matchId: string): Promise<boolean> {
  const [node, dependentCount] = await Promise.all([
    prisma.bracketNode.findFirst({
      where: { match_id: matchId },
      select: { id: true },
    }),
    prisma.match.count({
      where: {
        OR: [
          { home_source_match_id: matchId },
          { away_source_match_id: matchId },
        ],
      },
    }),
  ]);
  return !!node || dependentCount > 0;
}

/** All elimination match ids in a division (for standings + list enrichment). */
export async function eliminationMatchIdsForDivision(
  divisionId: string,
): Promise<Set<string>> {
  const [bracketMatches, sourceRefs] = await Promise.all([
    prisma.bracketNode.findMany({
      where: { division_id: divisionId, match_id: { not: null } },
      select: { match_id: true },
    }),
    prisma.match.findMany({
      where: {
        division_id: divisionId,
        OR: [
          { home_source_match_id: { not: null } },
          { away_source_match_id: { not: null } },
        ],
      },
      select: { home_source_match_id: true, away_source_match_id: true },
    }),
  ]);

  const ids = new Set<string>();
  for (const n of bracketMatches) {
    if (n.match_id) ids.add(n.match_id);
  }
  for (const m of sourceRefs) {
    if (m.home_source_match_id) ids.add(m.home_source_match_id);
    if (m.away_source_match_id) ids.add(m.away_source_match_id);
  }
  return ids;
}

export function toEngineMatchResult(match: MatchOutcomeFields): MatchResult {
  return {
    homeTeamId: match.home_team_id ?? '',
    awayTeamId: match.away_team_id ?? '',
    homeScore: match.home_score,
    awayScore: match.away_score,
    outcome: 'PLAYED',
    homePenalties: match.home_penalties ?? null,
    awayPenalties: match.away_penalties ?? null,
  };
}

/** Winner/loser when a match has a decisive result; null when still level. */
export function resolveAdvancingTeams(
  match: MatchOutcomeFields,
): { winnerId: string; loserId: string } | null {
  if (!match.home_team_id || !match.away_team_id) return null;

  const resolution = resolveKnockoutMatch(
    toEngineMatchResult(match),
    USFA_TOURNAMENT_CONFIG,
  );
  if (!resolution.resolved || !resolution.winnerId || !resolution.loserId) {
    return null;
  }
  return { winnerId: resolution.winnerId, loserId: resolution.loserId };
}

export function hasDecisivePenaltyShootout(match: MatchOutcomeFields): boolean {
  if (match.home_score !== match.away_score) return false;
  const hp = match.home_penalties;
  const ap = match.away_penalties;
  return hp != null && ap != null && hp !== ap;
}

/** Error message when an elimination match cannot be finalized; null when valid. */
export function getEliminationCompletionError(
  match: MatchOutcomeFields,
  isElimination: boolean,
): string | null {
  if (!isElimination) return null;
  if (match.home_score !== match.away_score) return null;
  if (hasDecisivePenaltyShootout(match)) return null;

  return 'This knockout match ended level — enter penalty shootout results (unequal totals) before completing it.';
}

/** Format score line for emails/display, including pens when applicable. */
export function formatMatchResultLine(
  homeScore: number,
  awayScore: number,
  homePenalties?: number | null,
  awayPenalties?: number | null,
): string {
  const base = `${homeScore} – ${awayScore}`;
  if (
    homeScore === awayScore &&
    homePenalties != null &&
    awayPenalties != null &&
    homePenalties !== awayPenalties
  ) {
    return `${base} (${homePenalties}–${awayPenalties} pens)`;
  }
  return base;
}
