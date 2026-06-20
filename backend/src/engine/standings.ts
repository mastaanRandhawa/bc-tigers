import type { MatchResult, StandingRow, TournamentConfig } from './types';
import { scoreMatch } from './scoring';
import { normalizeResult } from './forfeit';
import { orderTiedGroup, type TieContext } from './tiebreakers';

function emptyRow(teamId: string): StandingRow {
  return {
    teamId,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    rank: 0,
  };
}

/** Aggregate raw totals (points, record, goals) for every team — unranked. */
export function aggregateRows(
  teamIds: string[],
  results: MatchResult[],
  config: TournamentConfig,
): Map<string, StandingRow> {
  const rows = new Map<string, StandingRow>();
  const ensure = (id: string) => {
    let row = rows.get(id);
    if (!row) {
      row = emptyRow(id);
      rows.set(id, row);
    }
    return row;
  };

  for (const id of teamIds) ensure(id);

  for (const match of results) {
    const norm = normalizeResult(match, config);
    const home = ensure(norm.homeTeamId);
    const away = ensure(norm.awayTeamId);
    const pts = scoreMatch(match, config);

    home.played++;
    away.played++;
    home.goalsFor += norm.homeScore;
    home.goalsAgainst += norm.awayScore;
    away.goalsFor += norm.awayScore;
    away.goalsAgainst += norm.homeScore;
    home.points += pts.home;
    away.points += pts.away;

    if (norm.homeScore > norm.awayScore) {
      home.wins++;
      away.losses++;
    } else if (norm.homeScore < norm.awayScore) {
      away.wins++;
      home.losses++;
    } else {
      home.draws++;
      away.draws++;
    }
  }

  for (const row of rows.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  return rows;
}

/**
 * Compute fully ranked round-robin standings.
 *
 * Teams are sorted by points; teams level on points are ordered by the
 * configured tiebreaker chain (head-to-head → fewest goals against → most goals
 * for → coin toss, by default). Ranks are 1-based.
 */
export function computeStandings(
  teamIds: string[],
  results: MatchResult[],
  config: TournamentConfig,
): StandingRow[] {
  const rows = aggregateRows(teamIds, results, config);
  const ctx: TieContext = { rows, results, config };

  // Sort by points first, then break ties within each equal-points group.
  const byPoints = [...rows.values()].sort((a, b) => b.points - a.points);

  const ranked: StandingRow[] = [];
  let i = 0;
  while (i < byPoints.length) {
    let j = i + 1;
    while (j < byPoints.length && byPoints[j].points === byPoints[i].points)
      j++;
    const group = byPoints.slice(i, j).map((r) => r.teamId);
    const ordered = group.length > 1 ? orderTiedGroup(group, ctx) : group;
    for (const teamId of ordered) ranked.push(rows.get(teamId)!);
    i = j;
  }

  ranked.forEach((row, idx) => {
    row.rank = idx + 1;
  });
  return ranked;
}
