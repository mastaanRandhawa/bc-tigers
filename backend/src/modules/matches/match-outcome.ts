import prisma from '../../prisma/prisma';
import { resolveKnockoutMatch } from '../../engine/knockout';
import { USFA_TOURNAMENT_CONFIG } from '../../engine/config';
import type { MatchResult } from '../../engine/types';

export type TieResolution = 'DRAW' | 'PENALTIES';

export type MatchOutcomeFields = {
  id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number;
  away_score: number;
  home_penalties?: number | null;
  away_penalties?: number | null;
  tie_resolution?: TieResolution | null;
};

/** Match ids excluded from round-robin / pool standings (bracket knockout fixtures only). */
export async function standingsExcludedMatchIdsForDivision(
  divisionId: string,
): Promise<Set<string>> {
  const bracketMatches = await prisma.bracketNode.findMany({
    where: { division_id: divisionId, match_id: { not: null } },
    select: { match_id: true },
  });
  return new Set(
    bracketMatches
      .map((n) => n.match_id)
      .filter((id): id is string => id != null),
  );
}

export function toEngineMatchResult(match: MatchOutcomeFields): MatchResult {
  const usePenalties = match.tie_resolution === 'PENALTIES';
  return {
    homeTeamId: match.home_team_id ?? '',
    awayTeamId: match.away_team_id ?? '',
    homeScore: match.home_score,
    awayScore: match.away_score,
    outcome: 'PLAYED',
    homePenalties: usePenalties ? (match.home_penalties ?? null) : null,
    awayPenalties: usePenalties ? (match.away_penalties ?? null) : null,
  };
}

/** Winner/loser for bracket/placeholder advancement; null when undecided or a draw. */
export function resolveAdvancingTeams(
  match: MatchOutcomeFields,
): { winnerId: string; loserId: string } | null {
  if (!match.home_team_id || !match.away_team_id) return null;

  if (match.home_score !== match.away_score) {
    const homeWon = match.home_score > match.away_score;
    return {
      winnerId: homeWon ? match.home_team_id : match.away_team_id,
      loserId: homeWon ? match.away_team_id : match.home_team_id,
    };
  }

  if (match.tie_resolution !== 'PENALTIES') return null;

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

/** Error when a tied match cannot be completed; null when valid. */
export function getTiedCompletionError(match: MatchOutcomeFields): string | null {
  if (match.home_score !== match.away_score) return null;

  if (!match.tie_resolution) {
    return 'Regulation ended level — choose whether to record a draw or break the tie with a penalty shootout.';
  }

  if (match.tie_resolution === 'DRAW') return null;

  if (match.tie_resolution === 'PENALTIES') {
    if (!hasDecisivePenaltyShootout(match)) {
      return 'Enter unequal penalty shootout totals before completing.';
    }
    return null;
  }

  return null;
}

/** Format score line for emails/display, including pens when applicable. */
export function formatMatchResultLine(
  homeScore: number,
  awayScore: number,
  homePenalties?: number | null,
  awayPenalties?: number | null,
  tieResolution?: TieResolution | null,
): string {
  const base = `${homeScore} – ${awayScore}`;
  if (
    tieResolution === 'PENALTIES' &&
    homeScore === awayScore &&
    homePenalties != null &&
    awayPenalties != null &&
    homePenalties !== awayPenalties
  ) {
    return `${base} (${homePenalties}–${awayPenalties} pens)`;
  }
  return base;
}
