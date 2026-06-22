import { propagateByes, setWinner } from './progression';
import {
  needsProgressionRepair,
  reconcileBracketProgression,
  repairProgressionLinks,
} from './repair';
import type { EngineNode } from './types';
import { planBracket, planToNodeDrafts } from '../scheduling/bracket-planner';
import type { EligibleTeam } from '../scheduling/types';

function team(id: string): EligibleTeam {
  return { id, name: id, slug: id, division_id: 'div-1', playerCount: 5 };
}

function draftsToEngine(drafts: ReturnType<typeof planToNodeDrafts>): EngineNode[] {
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
      seeding: 'standard',
      rankedTeamIds: teams.map((t) => t.id),
    });
    const nodes = draftsToEngine(planToNodeDrafts(plan));

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
    expect(third?.home_team_id === loser || third?.away_team_id === loser).toBe(true);

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
    expect(thirdAfter?.home_team_id === loser || thirdAfter?.away_team_id === loser).toBe(true);
  });
});
