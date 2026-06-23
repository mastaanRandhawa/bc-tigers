import { propagateByes, setWinner } from './progression';
import {
  needsProgressionRepair,
  reconcileBracketProgression,
  repairProgressionLinks,
  replaySavedWinners,
} from './repair';
import type { EngineNode } from './types';
import { planBracket, planToNodeDrafts } from '../scheduling/bracket-planner';
import { buildFirstRoundSlots } from '../scheduling/seed-order';
import type { EligibleTeam } from '../scheduling/types';

function team(id: string): EligibleTeam {
  return { id, name: id, slug: id, division_id: 'div-1', playerCount: 5 };
}

function draftsToEngine(
  drafts: ReturnType<typeof planToNodeDrafts>,
): EngineNode[] {
  return drafts.map((d) => ({
    id: d.id!,
    division_id: d.division_id,
    stage: d.stage,
    position: d.position,
    home_team_id: d.home_team_id ?? null,
    away_team_id: d.away_team_id ?? null,
    winner_id: null,
    match_id: null,
    status: 'PENDING' as const,
    next_node_id: d.next_node_id ?? null,
    next_slot: d.next_slot ?? null,
    loser_next_node_id: d.loser_next_node_id ?? null,
    loser_next_slot: d.loser_next_slot ?? null,
    auto_advanced: false,
    completed_at: null,
    match: null,
  }));
}

describe('bracket repair', () => {
  it('repairs missing progression links and routes losers to third place', () => {
    const teams = Array.from({ length: 8 }, (_, i) => team(`t${i + 1}`));
    const plan = planBracket({
      divisionId: 'div-1',
      teams,
    });
    const nodes = draftsToEngine(planToNodeDrafts(plan));
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

    for (const node of nodes) {
      node.next_node_id = null;
      node.next_slot = null;
      node.loser_next_node_id = null;
      node.loser_next_slot = null;
    }

    expect(needsProgressionRepair(nodes)).toBe(true);

    repairProgressionLinks(nodes);
    propagateByes(nodes);

    const qfReady = nodes.filter(
      (n) => n.stage === 'QUARTER_FINAL' && n.home_team_id && n.away_team_id,
    );
    for (const qf of qfReady) {
      setWinner(nodes, qf.id, qf.home_team_id!, 'manual');
    }

    const semis = nodes.filter(
      (n) => n.stage === 'SEMI_FINAL' && n.home_team_id && n.away_team_id,
    );
    const sf = semis[0];
    const loser = sf.away_team_id!;
    setWinner(nodes, sf.id, sf.home_team_id!, 'manual');

    const third = nodes.find((n) => n.stage === 'THIRD_PLACE');
    expect(third?.home_team_id === loser || third?.away_team_id === loser).toBe(
      true,
    );

    for (const node of nodes) {
      node.next_node_id = null;
      node.loser_next_node_id = null;
      node.loser_next_slot = null;
      node.next_slot = null;
    }
    const thirdBefore = nodes.find((n) => n.stage === 'THIRD_PLACE');
    thirdBefore!.home_team_id = null;
    thirdBefore!.away_team_id = null;

    repairProgressionLinks(nodes);
    reconcileBracketProgression(nodes);

    expect(needsProgressionRepair(nodes)).toBe(false);
    const thirdAfter = nodes.find((n) => n.stage === 'THIRD_PLACE');
    expect(
      thirdAfter?.home_team_id === loser || thirdAfter?.away_team_id === loser,
    ).toBe(true);
  });

  it('does not auto-advance when a team is removed leaving one slot filled', () => {
    const teams = Array.from({ length: 8 }, (_, i) => team(`t${i + 1}`));
    const plan = planBracket({
      divisionId: 'div-1',
      teams,
    });
    const nodes = draftsToEngine(planToNodeDrafts(plan));
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

    const qf = nodes.find(
      (n) =>
        n.stage === 'QUARTER_FINAL' && n.home_team_id && n.away_team_id,
    )!;
    qf.away_team_id = null;
    qf.winner_id = null;
    qf.auto_advanced = false;

    replaySavedWinners(nodes);

    expect(qf.winner_id).toBeNull();
    expect(qf.auto_advanced).toBe(false);
    expect(qf.status).toBe('PENDING');
    const sf = nodes.find((n) => n.id === qf.next_node_id);
    expect(sf?.home_team_id).toBeFalsy();
    expect(sf?.away_team_id).toBeFalsy();
    expect(sf?.winner_id).toBeNull();
  });

  it('replaySavedWinners restores manual winners after downstream reset', () => {
    const teams = Array.from({ length: 8 }, (_, i) => team(`t${i + 1}`));
    const plan = planBracket({
      divisionId: 'div-1',
      teams,
    });
    const nodes = draftsToEngine(planToNodeDrafts(plan));
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

    const qf = nodes.find(
      (n) =>
        n.stage === 'QUARTER_FINAL' && n.home_team_id && n.away_team_id,
    )!;
    setWinner(nodes, qf.id, qf.home_team_id!, 'manual');

    replaySavedWinners(nodes);

    const won = nodes.find((n) => n.id === qf.id);
    expect(won?.winner_id).toBe(qf.home_team_id);
    const sf = nodes.find((n) => n.id === qf.next_node_id);
    expect(
      sf?.home_team_id === qf.home_team_id ||
        sf?.away_team_id === qf.home_team_id,
    ).toBe(true);
    expect(sf?.winner_id).toBeNull();
  });
});
