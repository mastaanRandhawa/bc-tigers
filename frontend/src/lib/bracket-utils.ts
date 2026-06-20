export type BracketSeeding = 'standard' | 'random' | 'manual';

export function bracketSizeForTeamCount(count: number): number {
  if (count <= 2) return 2;
  let size = 2;
  while (size < count) size *= 2;
  return Math.min(size, 16);
}

export function byeCountForTeamCount(count: number): number {
  return bracketSizeForTeamCount(count) - count;
}

export function bracketFormatLabel(teamCount: number): string {
  const size = bracketSizeForTeamCount(teamCount);
  if (size === 2) return 'Final only';
  if (size === 4) return 'Semi-finals + Final';
  if (size === 8) return 'Quarter-finals + Final';
  const byes = byeCountForTeamCount(teamCount);
  return byes > 0
    ? `Round of 16 + Final (${byes} BYE${byes > 1 ? 's' : ''})`
    : 'Round of 16 + Final';
}

export function shuffleTeamIds(teamIds: string[]): string[] {
  const copy = [...teamIds];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export type BracketSnapshot = Array<{
  id: string;
  home_team_id?: string | null;
  away_team_id?: string | null;
  winner_id?: string | null;
}>;

export function snapshotFromNodes(
  nodes: Array<{
    id: string;
    home_team_id?: string | null;
    away_team_id?: string | null;
    winner_id?: string | null;
  }>,
): BracketSnapshot {
  return nodes.map((n) => ({
    id: n.id,
    home_team_id: n.home_team_id ?? null,
    away_team_id: n.away_team_id ?? null,
    winner_id: n.winner_id ?? null,
  }));
}

export function isBracketLocked(
  nodes: Array<{ winner_id?: string | null; match?: { status?: string } | null }>,
): boolean {
  return nodes.some(
    (n) =>
      !!n.winner_id ||
      n.match?.status === 'LIVE' ||
      n.match?.status === 'COMPLETED',
  );
}

export function isByeSlot(
  node: { home_team_id?: string | null; away_team_id?: string | null },
  slot: 'home' | 'away',
): boolean {
  const hasHome = !!node.home_team_id;
  const hasAway = !!node.away_team_id;
  if (hasHome && hasAway) return false;
  if (slot === 'home') return !hasHome && hasAway;
  return !hasAway && hasHome;
}

export function earliestStage(
  nodes: Array<{ stage: string }>,
  stageOrder: string[],
): string | null {
  let best: string | null = null;
  let bestIdx = 99;
  for (const n of nodes) {
    const idx = stageOrder.indexOf(n.stage);
    if (idx >= 0 && idx < bestIdx) {
      bestIdx = idx;
      best = n.stage;
    }
  }
  return best;
}

export const BRACKET_TEAM_DRAG_TYPE = 'application/x-bct-bracket-team';
export const BRACKET_MATCH_DRAG_TYPE = 'application/x-bct-bracket-match';

export function configureTeamDrag(e: DragEvent, teamId: string) {
  e.dataTransfer?.setData(BRACKET_TEAM_DRAG_TYPE, teamId);
  e.dataTransfer?.setData('text/plain', teamId);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
}

export function configureMatchDrag(e: DragEvent, nodeId: string) {
  e.dataTransfer?.setData(BRACKET_MATCH_DRAG_TYPE, nodeId);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
}

export function readTeamDragId(e: DragEvent): string | null {
  return (
    e.dataTransfer?.getData(BRACKET_TEAM_DRAG_TYPE) ||
    e.dataTransfer?.getData('text/plain') ||
    null
  );
}

export function readMatchDragId(e: DragEvent): string | null {
  return e.dataTransfer?.getData(BRACKET_MATCH_DRAG_TYPE) || null;
}

/** Match backend standard seed ordering for team pool display. */
export function computeStandardSeedByTeamId(
  teams: Array<{ id: string; name: string }>,
  standings: Array<{
    team_id: string;
    rank?: number;
    points?: number;
    goal_difference?: number;
  }> = [],
): Map<string, number> {
  const standingByTeam = new Map(standings.map((s) => [s.team_id, s]));
  const sorted = [...teams].sort((a, b) => {
    const sa = standingByTeam.get(a.id);
    const sb = standingByTeam.get(b.id);
    const rankA = sa?.rank && sa.rank > 0 ? sa.rank : Number.MAX_SAFE_INTEGER;
    const rankB = sb?.rank && sb.rank > 0 ? sb.rank : Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    const pointsDiff = (sb?.points ?? 0) - (sa?.points ?? 0);
    if (pointsDiff !== 0) return pointsDiff;
    const gdDiff = (sb?.goal_difference ?? 0) - (sa?.goal_difference ?? 0);
    if (gdDiff !== 0) return gdDiff;
    return a.name.localeCompare(b.name);
  });
  return new Map(sorted.map((t, i) => [t.id, i + 1]));
}
