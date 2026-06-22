import type { BracketStage } from '@prisma/client';
import { propagateByes, setWinner } from './progression';
import { validateBracket } from './validation';
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

function buildBracket(teamCount: number) {
  const teams = Array.from({ length: teamCount }, (_, i) => team(`t${i + 1}`));
  const plan = planBracket({
    divisionId: 'div-1',
    teams,
    seeding: 'standard',
    rankedTeamIds: teams.map((t) => t.id),
  });
  const drafts = planToNodeDrafts(plan);
  const nodes = draftsToEngine(drafts);
  propagateByes(nodes);
  return { plan, nodes };
}

describe('bracket-engine', () => {
  it('generates valid bracket for 8 teams with third place', () => {
    const { plan, nodes } = buildBracket(8);
    expect(plan.stages).toContain('THIRD_PLACE');
    const validation = validateBracket(nodes);
    expect(validation.valid).toBe(true);
    const third = nodes.find((n) => n.stage === 'THIRD_PLACE');
    expect(third).toBeDefined();
  });

  it('auto-advances BYEs without BYE as winner display team', () => {
    const { nodes } = buildBracket(6);
    const byeWinners = nodes.filter((n) => n.auto_advanced);
    expect(byeWinners.length).toBeGreaterThan(0);
    for (const n of byeWinners) {
      expect(n.winner_id).toMatch(/^t\d+$/);
      expect(n.status).toBe('AUTO_ADVANCED');
    }
  });

  it('propagates winner through quarter to semi to final', () => {
    const { nodes } = buildBracket(8);
    const qf = nodes.filter((n) => n.stage === 'QUARTER_FINAL' && n.status === 'READY');
    expect(qf.length).toBeGreaterThan(0);

    const first = qf[0];
    const winnerId = first.home_team_id!;
    setWinner(nodes, first.id, winnerId, 'manual');

    const sf = nodes.find(
      (n) => n.id === first.next_node_id,
    );
    expect(sf?.home_team_id === winnerId || sf?.away_team_id === winnerId).toBe(true);

    const validation = validateBracket(nodes);
    expect(validation.valid).toBe(true);
  });

  it('clears downstream when winner changes', () => {
    const { nodes } = buildBracket(8);
    const qf = nodes.find((n) => n.stage === 'QUARTER_FINAL' && n.home_team_id && n.away_team_id)!;
    const home = qf.home_team_id!;
    const away = qf.away_team_id!;

    setWinner(nodes, qf.id, home, 'manual');
    const sfAfterHome = nodes.find((n) => n.id === qf.next_node_id);
    expect(sfAfterHome?.home_team_id === home || sfAfterHome?.away_team_id === home).toBe(true);

    setWinner(nodes, qf.id, away, 'manual');
    const sfAfterAway = nodes.find((n) => n.id === qf.next_node_id);
    expect(sfAfterAway?.home_team_id === away || sfAfterAway?.away_team_id === away).toBe(true);
    expect(
      sfAfterAway?.home_team_id === home || sfAfterAway?.away_team_id === home,
    ).toBe(false);
  });

  it('routes semi-final loser to third place', () => {
    const { nodes } = buildBracket(8);
    const qfReady = nodes.filter(
      (n) => n.stage === 'QUARTER_FINAL' && n.home_team_id && n.away_team_id,
    );
    for (const qf of qfReady) {
      setWinner(nodes, qf.id, qf.home_team_id!, 'manual');
    }

    const semis = nodes.filter(
      (n) => n.stage === 'SEMI_FINAL' && n.home_team_id && n.away_team_id,
    );
    expect(semis.length).toBeGreaterThan(0);
    const sf = semis[0];
    const winner = sf.home_team_id!;
    const loser = sf.away_team_id!;
    setWinner(nodes, sf.id, winner, 'manual');

    const third = nodes.find((n) => n.stage === 'THIRD_PLACE');
    expect(third?.home_team_id === loser || third?.away_team_id === loser).toBe(true);
  });

  it('rejects winner not on node', () => {
    const { nodes } = buildBracket(8);
    const qf = nodes.find((n) => n.stage === 'QUARTER_FINAL' && n.home_team_id && n.away_team_id)!;
    expect(() => setWinner(nodes, qf.id, 'unknown-team', 'manual')).toThrow();
  });

  it('validates duplicate team in same stage', () => {
    const { nodes } = buildBracket(8);
    const qf = nodes.filter((n) => n.stage === 'QUARTER_FINAL');
    if (qf[0].home_team_id) {
      qf[1].home_team_id = qf[0].home_team_id;
    }
    const validation = validateBracket(nodes);
    expect(validation.valid).toBe(false);
  });
});
