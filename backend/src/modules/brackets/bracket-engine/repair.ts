import type { BracketStage } from '@prisma/client';
import {
  loserBracketSlot,
  nextBracketSlot,
} from '../scheduling/bracket-planner';
import {
  propagateByes,
  resetDownstreamTeams,
  setWinner,
  type WinnerSource,
} from './progression';
import { computeNodeStatus, soleTeamId } from './status';
import type { EngineNode } from './types';
import { findNode } from './types';

const STAGE_ORDER: BracketStage[] = [
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'FINAL',
  'THIRD_PLACE',
];

function firstStageInBracket(nodes: EngineNode[]): BracketStage | null {
  for (const stage of STAGE_ORDER) {
    if (nodes.some((n) => n.stage === stage)) return stage;
  }
  return null;
}

/** Wire missing next/loser progression links from stage + position. */
export function repairProgressionLinks(nodes: EngineNode[]): boolean {
  let changed = false;

  for (const node of nodes) {
    const next = nextBracketSlot(node.stage, node.position);
    if (next) {
      const nextNode = findNode(nodes, next.stage, next.position);
      if (nextNode) {
        if (node.next_node_id !== nextNode.id) {
          node.next_node_id = nextNode.id;
          changed = true;
        }
        if (node.next_slot !== next.slot) {
          node.next_slot = next.slot;
          changed = true;
        }
      }
    }

    const loser = loserBracketSlot(node.stage, node.position);
    if (loser) {
      const loserNode = findNode(nodes, loser.stage, loser.position);
      if (loserNode) {
        if (node.loser_next_node_id !== loserNode.id) {
          node.loser_next_node_id = loserNode.id;
          changed = true;
        }
        if (node.loser_next_slot !== loser.slot) {
          node.loser_next_slot = loser.slot;
          changed = true;
        }
      }
    }
  }

  return changed;
}

export function needsProgressionRepair(nodes: EngineNode[]): boolean {
  return nodes.some(
    (n) =>
      (n.stage === 'SEMI_FINAL' ||
        n.stage === 'QUARTER_FINAL' ||
        n.stage === 'ROUND_OF_16') &&
      (!n.next_node_id || (n.stage === 'SEMI_FINAL' && !n.loser_next_node_id)),
  );
}

/** Rebuild downstream from saved winners without inventing new BYE advances. */
export function replaySavedWinners(nodes: EngineNode[]): void {
  const firstStage = firstStageInBracket(nodes);
  if (!firstStage) return;

  const saved = new Map<string, { winnerId: string; source: WinnerSource }>();
  for (const node of nodes) {
    if (!node.winner_id) continue;
    const sole = soleTeamId(node);
    const source: WinnerSource =
      node.auto_advanced || (sole !== null && sole === node.winner_id)
        ? 'bye'
        : 'manual';
    saved.set(node.id, { winnerId: node.winner_id, source });
  }

  resetDownstreamTeams(nodes, firstStage);

  for (const stage of STAGE_ORDER.filter((s) => s !== 'THIRD_PLACE')) {
    const stageNodes = nodes
      .filter((n) => n.stage === stage)
      .sort((a, b) => a.position - b.position);
    for (const node of stageNodes) {
      const outcome = saved.get(node.id);
      if (!outcome) continue;
      setWinner(nodes, node.id, outcome.winnerId, outcome.source);
    }
  }

  for (const node of nodes) {
    node.status = computeNodeStatus(node);
  }
}

/** Rebuild downstream placements from saved winners after links are repaired. */
export function reconcileBracketProgression(nodes: EngineNode[]): void {
  const saved = new Map<
    string,
    { winnerId: string; source: WinnerSource; autoAdvanced: boolean }
  >();
  for (const node of nodes) {
    if (node.winner_id) {
      saved.set(node.id, {
        winnerId: node.winner_id,
        source: node.auto_advanced ? 'bye' : 'manual',
        autoAdvanced: node.auto_advanced,
      });
    }
  }

  const firstStage = firstStageInBracket(nodes);
  if (!firstStage) return;

  resetDownstreamTeams(nodes, firstStage);
  propagateByes(nodes);

  for (const stage of STAGE_ORDER.filter((s) => s !== 'THIRD_PLACE')) {
    const stageNodes = nodes
      .filter((n) => n.stage === stage)
      .sort((a, b) => a.position - b.position);
    for (const node of stageNodes) {
      const outcome = saved.get(node.id);
      if (!outcome || outcome.autoAdvanced) continue;
      setWinner(nodes, node.id, outcome.winnerId, outcome.source);
    }
  }

  for (const node of nodes) {
    node.status = computeNodeStatus(node);
  }
}
