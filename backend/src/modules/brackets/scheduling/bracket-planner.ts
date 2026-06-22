import type { BracketStage } from '@prisma/client';
import type { BracketNodeDraft, BracketPlan, BracketSeeding, EligibleTeam } from './types';
import { bracketSizeForTeamCount, byeCountForTeamCount } from './bye-calculator';
import { buildFirstRoundSlots } from './seed-order';
import { orderTeamsBySeeding } from './seeding-strategy';
import { validateBracketGeneration, type EligibilityInput } from './team-eligibility';

const STAGE_ORDER: BracketStage[] = [
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'FINAL',
  'THIRD_PLACE',
];

export function firstStageForSize(size: number): BracketStage {
  if (size >= 16) return 'ROUND_OF_16';
  if (size >= 8) return 'QUARTER_FINAL';
  if (size >= 4) return 'SEMI_FINAL';
  return 'FINAL';
}

export function stagesForSize(size: number): BracketStage[] {
  const first = firstStageForSize(size);
  const main = STAGE_ORDER.slice(STAGE_ORDER.indexOf(first), STAGE_ORDER.indexOf('FINAL') + 1);
  // Third-place match when bracket has semi-finals (4+ bracket size)
  if (size >= 4) {
    return [...main, 'THIRD_PLACE'];
  }
  return main;
}

export function matchesInStage(bracketSize: number, stage: BracketStage): number {
  if (stage === 'THIRD_PLACE') return bracketSize >= 4 ? 1 : 0;
  const first = firstStageForSize(bracketSize);
  const firstIdx = STAGE_ORDER.indexOf(first);
  const stageIdx = STAGE_ORDER.indexOf(stage);
  if (stageIdx < firstIdx || stageIdx > STAGE_ORDER.indexOf('FINAL')) return 0;
  const roundsFromFirst = stageIdx - firstIdx;
  return bracketSize / Math.pow(2, roundsFromFirst + 1);
}

export interface PlanBracketInput {
  divisionId: string;
  teams: EligibleTeam[];
  seeding: BracketSeeding;
  rankedTeamIds?: string[];
  randomSeed?: number;
  locked?: boolean;
}

export function planBracket(input: PlanBracketInput): BracketPlan {
  const eligibilityInput: EligibilityInput = {
    divisionId: input.divisionId,
    teams: input.teams.map((t) => ({
      ...t,
      players: Array.from({ length: t.playerCount }, () => ({ active: true })),
    })),
    seeding: input.seeding,
    locked: input.locked,
  };

  const validation = validateBracketGeneration(eligibilityInput);
  if (!validation.valid) {
    return {
      divisionId: input.divisionId,
      teamCount: input.teams.length,
      bracketSize: 0,
      byeCount: 0,
      seeding: input.seeding,
      firstStage: 'FINAL',
      stages: [],
      firstRound: [],
      validation,
    };
  }

  const bracketSize = bracketSizeForTeamCount(input.teams.length);
  const byeCount = byeCountForTeamCount(input.teams.length);
  const firstStage = firstStageForSize(bracketSize);
  const stages = stagesForSize(bracketSize);

  const orderedTeamIds =
    input.seeding === 'manual'
      ? []
      : orderTeamsBySeeding(input.teams, input.seeding, {
          rankedTeamIds: input.rankedTeamIds,
          randomSeed: input.randomSeed,
        });

  const slotData =
    input.seeding === 'manual'
      ? Array.from({ length: bracketSize / 2 }, (_, position) => ({
          homeTeamId: null as string | null,
          awayTeamId: null as string | null,
          homeSeed: position * 2 + 1,
          awaySeed: position * 2 + 2,
        }))
      : buildFirstRoundSlots(orderedTeamIds, bracketSize);

  const firstRound = slotData.map((slot, position) => ({
    position,
    homeTeamId: slot.homeTeamId,
    awayTeamId: slot.awayTeamId,
    homeSeed: slot.homeSeed,
    awaySeed: slot.awaySeed,
    isBye: !!(slot.homeTeamId && !slot.awayTeamId) || !!(!slot.homeTeamId && slot.awayTeamId),
  }));

  return {
    divisionId: input.divisionId,
    teamCount: input.teams.length,
    bracketSize,
    byeCount,
    seeding: input.seeding,
    firstStage,
    stages,
    firstRound,
    validation,
  };
}

export function loserBracketSlot(
  stage: BracketStage,
  position: number,
): { stage: BracketStage; position: number; slot: 'home' | 'away' } | null {
  if (stage !== 'SEMI_FINAL') return null;
  return { stage: 'THIRD_PLACE', position: 0, slot: position === 0 ? 'home' : 'away' };
}

export function planToNodeDrafts(plan: BracketPlan): BracketNodeDraft[] {
  if (!plan.validation.valid) return [];

  const nodes: BracketNodeDraft[] = [];
  const key = (stage: BracketStage, position: number) => `${stage}:${position}`;
  const idByKey = new Map<string, string>();

  const addNode = (draft: Omit<BracketNodeDraft, 'id'>): string => {
    const id = crypto.randomUUID();
    idByKey.set(key(draft.stage, draft.position), id);
    nodes.push({ ...draft, id });
    return id;
  };

  for (const slot of plan.firstRound) {
    addNode({
      division_id: plan.divisionId,
      stage: plan.firstStage,
      position: slot.position,
      ...(slot.homeTeamId ? { home_team_id: slot.homeTeamId } : {}),
      ...(slot.awayTeamId ? { away_team_id: slot.awayTeamId } : {}),
    });
  }

  for (const stage of plan.stages.slice(1)) {
    const count = matchesInStage(plan.bracketSize, stage);
    for (let position = 0; position < count; position++) {
      addNode({
        division_id: plan.divisionId,
        stage,
        position,
      });
    }
  }

  // Wire winner and loser progression links
  for (const node of nodes) {
    const next = nextBracketSlot(node.stage, node.position);
    if (next) {
      const nextId = idByKey.get(key(next.stage, next.position));
      if (nextId) {
        node.next_node_id = nextId;
        node.next_slot = next.slot;
      }
    }
    const loser = loserBracketSlot(node.stage, node.position);
    if (loser) {
      const loserId = idByKey.get(key(loser.stage, loser.position));
      if (loserId) {
        node.loser_next_node_id = loserId;
        node.loser_next_slot = loser.slot;
      }
    }
  }

  return nodes;
}

export function nextBracketSlot(
  stage: BracketStage,
  position: number,
): { stage: BracketStage; position: number; slot: 'home' | 'away' } | null {
  switch (stage) {
    case 'ROUND_OF_16':
      return {
        stage: 'QUARTER_FINAL',
        position: Math.floor(position / 2),
        slot: position % 2 === 0 ? 'home' : 'away',
      };
    case 'QUARTER_FINAL':
      return {
        stage: 'SEMI_FINAL',
        position: Math.floor(position / 2),
        slot: position % 2 === 0 ? 'home' : 'away',
      };
    case 'SEMI_FINAL':
      return { stage: 'FINAL', position: 0, slot: position === 0 ? 'home' : 'away' };
    default:
      return null;
  }
}
