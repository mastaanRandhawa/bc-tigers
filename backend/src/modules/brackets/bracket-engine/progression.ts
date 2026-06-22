import type { EngineNode } from './types';
import { nodeMap } from './types';
import { computeNodeStatus, isByeNode, soleTeamId } from './status';

/** Clear all downstream state fed from this node (winners + team slots). */
export function clearDownstream(nodes: EngineNode[], fromNodeId: string): void {
  const map = nodeMap(nodes);
  const visited = new Set<string>();

  const clearNode = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = map.get(nodeId);
    if (!node) return;

    node.home_team_id = null;
    node.away_team_id = null;
    node.winner_id = null;
    node.auto_advanced = false;
    node.completed_at = null;
    node.status = computeNodeStatus(node);

    if (node.next_node_id) clearNode(node.next_node_id);
    if (node.loser_next_node_id) clearNode(node.loser_next_node_id);
  };

  const from = map.get(fromNodeId);
  if (!from) return;

  if (from.next_node_id) {
    const next = map.get(from.next_node_id);
    if (next && from.next_slot) {
      if (from.next_slot === 'home') next.home_team_id = null;
      else next.away_team_id = null;
      next.winner_id = null;
      next.auto_advanced = false;
      next.completed_at = null;
      next.status = computeNodeStatus(next);
      clearDownstreamFrom(next.id, nodes, fromNodeId);
    }
  }
  if (from.loser_next_node_id) {
    const loserNext = map.get(from.loser_next_node_id);
    if (loserNext && from.loser_next_slot) {
      if (from.loser_next_slot === 'home') loserNext.home_team_id = null;
      else loserNext.away_team_id = null;
      loserNext.winner_id = null;
      loserNext.auto_advanced = false;
      loserNext.completed_at = null;
      loserNext.status = computeNodeStatus(loserNext);
      clearDownstreamFrom(loserNext.id, nodes, fromNodeId);
    }
  }
}

function clearDownstreamFrom(
  startId: string,
  nodes: EngineNode[],
  originId: string,
): void {
  const map = nodeMap(nodes);
  const queue = [startId];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id) || id === originId) continue;
    seen.add(id);
    const node = map.get(id);
    if (!node) continue;

    node.home_team_id = null;
    node.away_team_id = null;
    node.winner_id = null;
    node.auto_advanced = false;
    node.completed_at = null;
    node.status = computeNodeStatus(node);

    if (node.next_node_id) queue.push(node.next_node_id);
    if (node.loser_next_node_id) queue.push(node.loser_next_node_id);
  }
}

function placeWinnerInNext(
  nodes: EngineNode[],
  from: EngineNode,
  winnerId: string,
): void {
  const map = nodeMap(nodes);
  if (from.next_node_id && from.next_slot) {
    const next = map.get(from.next_node_id);
    if (next) {
      placeTeamInSlot(next, from.next_slot, winnerId);
      next.status = computeNodeStatus(next);
    }
  }
}

function placeLoserInThirdPlace(
  nodes: EngineNode[],
  from: EngineNode,
  winnerId: string,
): void {
  const map = nodeMap(nodes);
  if (!from.loser_next_node_id || !from.loser_next_slot) return;
  const loserId =
    from.home_team_id === winnerId ? from.away_team_id : from.home_team_id;
  if (!loserId) return;
  const third = map.get(from.loser_next_node_id);
  if (third) {
    placeTeamInSlot(third, from.loser_next_slot, loserId);
    third.status = computeNodeStatus(third);
  }
}

function placeTeamInSlot(
  node: EngineNode,
  slot: 'home' | 'away',
  teamId: string,
): void {
  if (slot === 'home') node.home_team_id = teamId;
  else node.away_team_id = teamId;
}

export type WinnerSource = 'manual' | 'match' | 'bye';

export interface SetWinnerResult {
  changed: boolean;
  nodes: EngineNode[];
}

/** Set or change the winner on a node; clears and rebuilds downstream. */
export function setWinner(
  nodes: EngineNode[],
  nodeId: string,
  winnerId: string,
  source: WinnerSource = 'manual',
): SetWinnerResult {
  const map = nodeMap(nodes);
  const node = map.get(nodeId);
  if (!node) throw new Error('Node not found');

  if (node.winner_id === winnerId) {
    return { changed: false, nodes };
  }

  if (node.home_team_id && node.away_team_id) {
    if (winnerId !== node.home_team_id && winnerId !== node.away_team_id) {
      throw new Error('Winner must be a participating team');
    }
  } else {
    const sole = soleTeamId(node);
    if (!sole || winnerId !== sole) {
      throw new Error('Invalid winner for this node');
    }
  }

  if (node.winner_id && node.winner_id !== winnerId) {
    clearDownstream(nodes, nodeId);
  }

  const isBye = isByeNode(node) && source === 'bye';
  node.winner_id = winnerId;
  node.auto_advanced = isBye;
  node.completed_at = isBye ? null : new Date();
  node.status = isBye ? 'AUTO_ADVANCED' : 'COMPLETED';

  placeWinnerInNext(nodes, node, winnerId);
  if (!isBye && node.home_team_id && node.away_team_id) {
    placeLoserInThirdPlace(nodes, node, winnerId);
  }

  return { changed: true, nodes };
}

/** Multi-round BYE propagation until stable. */
export function propagateByes(nodes: EngineNode[]): boolean {
  let changed = false;
  let pass = true;

  while (pass) {
    pass = false;
    for (const node of [...nodes]) {
      if (node.winner_id) continue;
      if (!node.home_team_id && !node.away_team_id) {
        node.status = 'INVALID';
        continue;
      }
      const sole = soleTeamId(node);
      if (!sole) {
        node.status = computeNodeStatus(node);
        continue;
      }
      try {
        const result = setWinner(nodes, node.id, sole, 'bye');
        if (result.changed) {
          changed = true;
          pass = true;
        }
      } catch {
        node.status = 'INVALID';
      }
    }
  }

  for (const node of nodes) {
    node.status = computeNodeStatus(node);
  }
  return changed;
}

/** Reset downstream from first stage before full bye re-propagation. */
export function resetDownstreamTeams(
  nodes: EngineNode[],
  firstStage: string,
): void {
  for (const node of nodes) {
    if (node.stage === firstStage) {
      node.winner_id = null;
      node.auto_advanced = false;
      node.completed_at = null;
    } else {
      node.home_team_id = null;
      node.away_team_id = null;
      node.winner_id = null;
      node.auto_advanced = false;
      node.completed_at = null;
    }
    node.status = computeNodeStatus(node);
  }
}
