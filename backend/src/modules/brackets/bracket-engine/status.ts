import type { BracketNodeStatus } from '@prisma/client';
import type { EngineNode } from './types';

/** Recompute status from teams, winner, match link, and auto-advance flag. */
export function computeNodeStatus(node: EngineNode): BracketNodeStatus {
  if (!node.home_team_id && !node.away_team_id) {
    return 'INVALID';
  }
  if (node.auto_advanced && node.winner_id) {
    return 'AUTO_ADVANCED';
  }
  if (node.winner_id) {
    return 'COMPLETED';
  }
  if (node.match?.status === 'LIVE' || node.match?.status === 'HALFTIME') {
    return 'IN_PROGRESS';
  }
  const hasHome = !!node.home_team_id;
  const hasAway = !!node.away_team_id;
  if (hasHome && hasAway) {
    return 'READY';
  }
  if (hasHome || hasAway) {
    return 'PENDING';
  }
  return 'INVALID';
}

export function isByeNode(node: EngineNode): boolean {
  const hasHome = !!node.home_team_id;
  const hasAway = !!node.away_team_id;
  return (hasHome && !hasAway) || (!hasHome && hasAway);
}

export function soleTeamId(node: EngineNode): string | null {
  if (node.home_team_id && !node.away_team_id) return node.home_team_id;
  if (node.away_team_id && !node.home_team_id) return node.away_team_id;
  return null;
}

export function canSelectWinner(node: EngineNode): boolean {
  if (node.auto_advanced) return false;
  if (!node.home_team_id || !node.away_team_id) return false;
  const status = computeNodeStatus(node);
  if (status !== 'READY' && status !== 'IN_PROGRESS') return false;
  return true;
}

export function placeTeamInSlot(
  node: EngineNode,
  slot: 'home' | 'away',
  teamId: string | null,
): void {
  if (slot === 'home') node.home_team_id = teamId;
  else node.away_team_id = teamId;
  node.status = computeNodeStatus(node);
}

export function clearSlotIfTeam(
  nodes: EngineNode[],
  teamId: string,
  exceptNodeId?: string,
): void {
  for (const n of nodes) {
    if (n.id === exceptNodeId) continue;
    if (n.home_team_id === teamId) {
      n.home_team_id = null;
      n.winner_id = null;
      n.auto_advanced = false;
      n.completed_at = null;
    }
    if (n.away_team_id === teamId) {
      n.away_team_id = null;
      n.winner_id = null;
      n.auto_advanced = false;
      n.completed_at = null;
    }
    n.status = computeNodeStatus(n);
  }
}
