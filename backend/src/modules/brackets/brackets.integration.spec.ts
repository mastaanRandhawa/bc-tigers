import { propagateByes, setWinner } from './bracket-engine/progression';
import {
  canEditResults,
  canEditStructure,
  hasPlayedMatches,
  validateBracket,
} from './bracket-engine/validation';
import type { EngineNode } from './bracket-engine/types';
import { planBracket, planToNodeDrafts } from './scheduling/bracket-planner';
import { buildFirstRoundSlots } from './scheduling/seed-order';
import type { EligibleTeam } from './scheduling/types';

function mockTeam(id: string): EligibleTeam {
  return { id, name: id, slug: id, division_id: 'div-1', playerCount: 5 };
}

function buildNodes(teamCount: number): EngineNode[] {
  const teams = Array.from({ length: teamCount }, (_, i) =>
    mockTeam(`t${i + 1}`),
  );
  const plan = planBracket({
    divisionId: 'div-1',
    teams,
  });
  const drafts = planToNodeDrafts(plan);
  const nodes: EngineNode[] = drafts.map((d) => ({
    id: d.id!,
    division_id: d.division_id,
    stage: d.stage,
    position: d.position,
    home_team_id: d.home_team_id ?? null,
    away_team_id: d.away_team_id ?? null,
    winner_id: null,
    match_id: null,
    status: 'PENDING',
    next_node_id: d.next_node_id ?? null,
    next_slot: d.next_slot ?? null,
    loser_next_node_id: d.loser_next_node_id ?? null,
    loser_next_slot: d.loser_next_slot ?? null,
    auto_advanced: false,
    completed_at: null,
    match: null,
  }));
  const slots = buildFirstRoundSlots(
    teams.map((t) => t.id),
    plan.bracketSize,
  );
  const firstRound = nodes
    .filter((n) => n.stage === plan.firstStage)
    .sort((a, b) => a.position - b.position);
  for (let i = 0; i < firstRound.length; i++) {
    firstRound[i].home_team_id = slots[i].homeTeamId;
    firstRound[i].away_team_id = slots[i].awayTeamId;
  }
  propagateByes(nodes);
  return nodes;
}

describe('BracketsService integration (lock & progression)', () => {
  it('BYE auto-advance does not count as played match activity', () => {
    const nodes = buildNodes(6);
    const byeNodes = nodes.filter((n) => n.auto_advanced);
    expect(byeNodes.length).toBeGreaterThan(0);
    expect(hasPlayedMatches(nodes)).toBe(false);
  });

  it('live or completed linked match counts as played', () => {
    const nodes = buildNodes(8);
    const qf = nodes.find((n) => n.stage === 'QUARTER_FINAL')!;
    qf.match = { status: 'LIVE' };
    expect(hasPlayedMatches(nodes)).toBe(true);
  });

  it('structure lock is separate from results frozen', () => {
    expect(
      canEditStructure({ bracket_locked: true, bracket_finalized: false }),
    ).toBe(false);
    expect(
      canEditStructure({ bracket_locked: false, bracket_finalized: false }),
    ).toBe(true);
    expect(
      canEditStructure({ bracket_locked: false, bracket_finalized: true }),
    ).toBe(false);

    expect(canEditResults({ bracket_finalized: false })).toBe(true);
    expect(canEditResults({ bracket_finalized: true })).toBe(false);
  });

  it('unfinalize unlocks structure when no matches have been played', async () => {
    const nodes = buildNodes(8);
    const played = hasPlayedMatches(nodes);
    expect(played).toBe(false);
    expect(
      canEditStructure({ bracket_locked: true, bracket_finalized: false }),
    ).toBe(false);
    expect(canEditResults({ bracket_finalized: false })).toBe(true);
  });
});
