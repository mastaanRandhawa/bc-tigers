import type { BracketNodeStatus, BracketStage } from '@prisma/client';

export type BracketSlot = 'home' | 'away';

export interface EngineNode {
  id: string;
  division_id: string;
  stage: BracketStage;
  position: number;
  home_team_id: string | null;
  away_team_id: string | null;
  winner_id: string | null;
  match_id: string | null;
  status: BracketNodeStatus;
  next_node_id: string | null;
  next_slot: BracketSlot | null;
  loser_next_node_id: string | null;
  loser_next_slot: BracketSlot | null;
  auto_advanced: boolean;
  completed_at: Date | null;
  match?: { status?: string } | null;
}

export interface DivisionBracketFlags {
  bracket_locked: boolean;
  bracket_finalized: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function toEngineNode(row: {
  id: string;
  division_id: string;
  stage: BracketStage;
  position: number;
  home_team_id: string | null;
  away_team_id: string | null;
  winner_id: string | null;
  match_id: string | null;
  status: BracketNodeStatus;
  next_node_id: string | null;
  next_slot: string | null;
  loser_next_node_id: string | null;
  loser_next_slot: string | null;
  auto_advanced: boolean;
  completed_at: Date | null;
  match?: { status?: string } | null;
}): EngineNode {
  return {
    ...row,
    next_slot: (row.next_slot as BracketSlot | null) ?? null,
    loser_next_slot: (row.loser_next_slot as BracketSlot | null) ?? null,
  };
}

export function nodeKey(stage: BracketStage, position: number): string {
  return `${stage}:${position}`;
}

export function findNode(
  nodes: EngineNode[],
  stage: BracketStage,
  position: number,
): EngineNode | undefined {
  return nodes.find((n) => n.stage === stage && n.position === position);
}

export function nodeMap(nodes: EngineNode[]): Map<string, EngineNode> {
  return new Map(nodes.map((n) => [n.id, n]));
}
