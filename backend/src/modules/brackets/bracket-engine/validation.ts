import type { BracketStage } from '@prisma/client';
import type { EngineNode, ValidationResult } from './types';

const STAGE_ORDER: BracketStage[] = [
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'FINAL',
  'THIRD_PLACE',
];

export function validateBracket(nodes: EngineNode[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (nodes.length === 0) {
    return { valid: true, errors, warnings };
  }

  const divisionIds = new Set(nodes.map((n) => n.division_id));
  if (divisionIds.size > 1) {
    errors.push('Bracket contains multiple divisions');
  }

  const keys = new Set<string>();
  for (const n of nodes) {
    const k = `${n.stage}:${n.position}`;
    if (keys.has(k)) errors.push(`Duplicate node ${k}`);
    keys.add(k);
  }

  for (const n of nodes) {
    if (n.home_team_id && n.away_team_id && n.home_team_id === n.away_team_id) {
      errors.push(`Node ${n.id}: same team on both sides`);
    }
    if (n.winner_id) {
      if (n.winner_id !== n.home_team_id && n.winner_id !== n.away_team_id) {
        errors.push(`Node ${n.id}: winner is not a participant`);
      }
    }
    if (n.next_node_id) {
      const next = nodes.find((x) => x.id === n.next_node_id);
      if (!next) errors.push(`Node ${n.id}: orphan next_node_id`);
    }
    if (n.loser_next_node_id) {
      const loserNext = nodes.find((x) => x.id === n.loser_next_node_id);
      if (!loserNext) errors.push(`Node ${n.id}: orphan loser_next_node_id`);
    }
  }

  // No duplicate teams within the same stage
  for (const stage of STAGE_ORDER) {
    const stageNodes = nodes.filter((n) => n.stage === stage);
    const teamIds = new Set<string>();
    for (const n of stageNodes) {
      for (const tid of [n.home_team_id, n.away_team_id].filter(
        Boolean,
      ) as string[]) {
        if (teamIds.has(tid)) {
          errors.push(`Team ${tid} appears twice in ${stage}`);
        }
        teamIds.add(tid);
      }
    }
  }

  // Circular next_node_id check
  for (const start of nodes) {
    const seen = new Set<string>();
    let cur: EngineNode | undefined = start;
    while (cur?.next_node_id) {
      if (seen.has(cur.id)) {
        errors.push('Circular progression detected');
        break;
      }
      seen.add(cur.id);
      cur = nodes.find((n) => n.id === cur!.next_node_id);
    }
  }

  const finalNodes = nodes.filter((n) => n.stage === 'FINAL');
  if (finalNodes.length > 1) {
    warnings.push('Multiple FINAL nodes');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function canEditStructure(flags: {
  bracket_locked: boolean;
  bracket_finalized: boolean;
}): boolean {
  return !flags.bracket_locked && !flags.bracket_finalized;
}

export function canEditResults(flags: { bracket_finalized: boolean }): boolean {
  return !flags.bracket_finalized;
}

export function hasPlayedMatches(nodes: EngineNode[]): boolean {
  return nodes.some(
    (n) =>
      n.match?.status === 'LIVE' ||
      n.match?.status === 'COMPLETED' ||
      n.match?.status === 'HALFTIME',
  );
}
