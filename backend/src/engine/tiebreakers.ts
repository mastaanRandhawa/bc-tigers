import type {
  MatchResult,
  StandingRow,
  TiebreakerRule,
  TournamentConfig,
} from './types';
import { scoreMatch } from './scoring';
import { normalizeResult } from './forfeit';
import { coinTossOrder, seededHash } from './random';

export interface TieContext {
  rows: Map<string, StandingRow>;
  results: MatchResult[];
  config: TournamentConfig;
}

/** Points each team earned in matches played only among `group`. */
function headToHeadPoints(
  group: string[],
  results: MatchResult[],
  config: TournamentConfig,
): Map<string, number> {
  const inGroup = new Set(group);
  const points = new Map<string, number>(group.map((id) => [id, 0]));
  for (const match of results) {
    if (!inGroup.has(match.homeTeamId) || !inGroup.has(match.awayTeamId)) {
      continue;
    }
    const pts = scoreMatch(match, config);
    points.set(
      match.homeTeamId,
      (points.get(match.homeTeamId) ?? 0) + pts.home,
    );
    points.set(
      match.awayTeamId,
      (points.get(match.awayTeamId) ?? 0) + pts.away,
    );
  }
  return points;
}

/**
 * Successful penalty kicks for `teamId` from its drawn match against the other
 * member of a two-team tie. Returns null when the rule cannot apply (group is
 * not exactly two teams, no mutual match, the match was not a draw, or no PK
 * data was recorded).
 */
function penaltyKicksFor(
  teamId: string,
  group: string[],
  results: MatchResult[],
): number | null {
  if (group.length !== 2) return null;
  const opponent = group[0] === teamId ? group[1] : group[0];
  for (const match of results) {
    const pair =
      (match.homeTeamId === teamId && match.awayTeamId === opponent) ||
      (match.homeTeamId === opponent && match.awayTeamId === teamId);
    if (!pair) continue;
    if (match.homeScore !== match.awayScore) return null; // not a draw
    if (match.homePenalties == null || match.awayPenalties == null) return null;
    return match.homeTeamId === teamId
      ? match.homePenalties
      : match.awayPenalties;
  }
  return null;
}

/**
 * "Betterness" of a team for one tiebreaker within `group`: higher ranks above
 * lower. Returns null when the rule does not apply, so the caller can treat the
 * teams as still tied and move to the next rule.
 */
function tieValue(
  rule: TiebreakerRule,
  teamId: string,
  group: string[],
  h2h: Map<string, number>,
  ctx: TieContext,
): number | null {
  const row = ctx.rows.get(teamId);
  if (!row) return null;
  switch (rule) {
    case 'HEAD_TO_HEAD':
      return h2h.get(teamId) ?? 0;
    case 'GOALS_AGAINST':
      return -row.goalsAgainst; // fewer conceded is better
    case 'GOALS_FOR':
      return row.goalsFor;
    case 'GOAL_DIFFERENCE':
      return row.goalDifference;
    case 'WINS':
      return row.wins;
    case 'PENALTY_KICKS':
      return penaltyKicksFor(teamId, group, ctx.results);
    case 'COIN_TOSS':
      return -seededHash(teamId, ctx.config.randomSeed); // lower hash wins
    default:
      return null;
  }
}

/**
 * Order a group of teams that are level on points, applying the configured
 * tiebreakers in sequence. The algorithm is recursive: each rule splits the
 * group into buckets of equal value, ordered best-first, and any bucket that
 * remains tied is resolved by the remaining rules — which matches how
 * head-to-head is meant to be recomputed among the still-level teams. A coin
 * toss guarantees a total order if every configured rule is exhausted.
 */
export function orderTiedGroup(group: string[], ctx: TieContext): string[] {
  return order(group, ctx.config.tiebreakers, ctx);
}

function order(
  group: string[],
  rules: TiebreakerRule[],
  ctx: TieContext,
): string[] {
  if (group.length <= 1) return group;
  if (rules.length === 0) {
    // Ultimate deterministic fallback so the result is always a total order.
    return coinTossOrder(group, ctx.config.randomSeed);
  }

  const [rule, ...rest] = rules;
  const h2h =
    rule === 'HEAD_TO_HEAD'
      ? headToHeadPoints(group, ctx.results, ctx.config)
      : new Map<string, number>();

  // A rule must rank every team in the group to be usable here; if it does not
  // apply to all (e.g. penalty kicks need a mutual drawn match), skip it and
  // let the remaining rules decide.
  const valued: { id: string; value: number }[] = [];
  for (const id of group) {
    const value = tieValue(rule, id, group, h2h, ctx);
    if (value === null) return order(group, rest, ctx);
    valued.push({ id, value });
  }

  valued.sort((a, b) => b.value - a.value);

  const ordered: string[] = [];
  let i = 0;
  while (i < valued.length) {
    let j = i + 1;
    while (j < valued.length && valued[j].value === valued[i].value) j++;
    const bucket = valued.slice(i, j).map((v) => v.id);
    ordered.push(...(bucket.length > 1 ? order(bucket, rest, ctx) : bucket));
    i = j;
  }
  return ordered;
}

/** Re-exported for callers that want normalized results when building context. */
export { normalizeResult };
