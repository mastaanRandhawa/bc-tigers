import {
  bracketSizeForTeamCount,
  byeCountForTeamCount,
  nextPowerOfTwo,
} from './bye-calculator';
import { standardSeedOrder, standardSeedPairs, buildFirstRoundSlots } from './seed-order';
import { planBracket } from './bracket-planner';
import { orderTeamsBySeeding } from './seeding-strategy';
import type { EligibleTeam } from './types';

describe('bye-calculator', () => {
  it.each([
    [2, 2, 0],
    [3, 4, 1],
    [4, 4, 0],
    [5, 8, 3],
    [6, 8, 2],
    [7, 8, 1],
    [8, 8, 0],
    [9, 16, 7],
    [14, 16, 2],
    [15, 16, 1],
    [16, 16, 0],
  ])('%i teams → size %i, %i byes', (teams, size, byes) => {
    expect(bracketSizeForTeamCount(teams)).toBe(size);
    expect(byeCountForTeamCount(teams)).toBe(byes);
  });
});

describe('standardSeedOrder', () => {
  it('orders 8-team bracket correctly', () => {
    expect(standardSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it('orders 16-team bracket with 16 unique seeds', () => {
    const order = standardSeedOrder(16);
    expect(order).toHaveLength(16);
    expect(new Set(order).size).toBe(16);
    expect(order[0]).toBe(1);
    expect(order[1]).toBe(16);
  });
});

describe('buildFirstRoundSlots', () => {
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `team-${i + 1}`);

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 14, 15, 16])(
    'places exactly %i teams once each in a %i bracket',
    (count) => {
      const teamIds = ids(count);
      const size = bracketSizeForTeamCount(count);
      const slots = buildFirstRoundSlots(teamIds, size);
      const placed = new Set<string>();
      for (const slot of slots) {
        if (slot.homeTeamId) {
          expect(placed.has(slot.homeTeamId)).toBe(false);
          placed.add(slot.homeTeamId);
        }
        if (slot.awayTeamId) {
          expect(placed.has(slot.awayTeamId)).toBe(false);
          placed.add(slot.awayTeamId);
        }
      }
      expect(placed.size).toBe(count);
      expect(slots.length).toBe(size / 2);
    },
  );

  it('assigns byes to top seeds for 14 teams', () => {
    const teamIds = ids(14);
    const slots = buildFirstRoundSlots(teamIds, 16);
    const byeMatches = slots.filter(
      (s) => (s.homeTeamId && !s.awayTeamId) || (!s.homeTeamId && s.awayTeamId),
    );
    expect(byeMatches).toHaveLength(2);
    expect(byeMatches[0].homeTeamId).toBe('team-1');
    expect(byeMatches[1].homeTeamId).toBe('team-2');
  });

  it('rejects duplicate team ids', () => {
    expect(() => buildFirstRoundSlots(['a', 'a'], 4)).toThrow(/Duplicate/);
  });
});

describe('planBracket', () => {
  function mockTeams(n: number): EligibleTeam[] {
    return Array.from({ length: n }, (_, i) => ({
      id: `t${i + 1}`,
      name: `Team ${i + 1}`,
      slug: `team-${i + 1}`,
      division_id: 'div-1',
      playerCount: 5,
    }));
  }

  it('plans 14-team bracket with 8 R16 matches', () => {
    const plan = planBracket({
      divisionId: 'div-1',
      teams: mockTeams(14),
      seeding: 'standard',
      rankedTeamIds: mockTeams(14).map((t) => t.id),
    });
    expect(plan.validation.valid).toBe(true);
    expect(plan.bracketSize).toBe(16);
    expect(plan.byeCount).toBe(2);
    expect(plan.firstRound).toHaveLength(8);
    expect(plan.firstStage).toBe('ROUND_OF_16');
  });

  it('fails validation with fewer than 2 teams', () => {
    const plan = planBracket({
      divisionId: 'div-1',
      teams: mockTeams(1),
      seeding: 'standard',
    });
    expect(plan.validation.valid).toBe(false);
  });

  it('random seeding is reproducible with same seed', () => {
    const teams = mockTeams(8);
    const a = orderTeamsBySeeding(teams, 'random', { randomSeed: 42 });
    const b = orderTeamsBySeeding(teams, 'random', { randomSeed: 42 });
    expect(a).toEqual(b);
    const c = orderTeamsBySeeding(teams, 'random', { randomSeed: 99 });
    expect(a).not.toEqual(c);
  });

  it('includes third place stage for brackets of 4 or more teams', () => {
    const plan = planBracket({
      divisionId: 'div-1',
      teams: mockTeams(8),
      seeding: 'standard',
      rankedTeamIds: mockTeams(8).map((t) => t.id),
    });
    expect(plan.stages).toContain('THIRD_PLACE');
    expect(plan.stages.indexOf('FINAL')).toBeLessThan(plan.stages.indexOf('THIRD_PLACE'));
  });
});

describe('standardSeedPairs', () => {
  it('never pairs a seed with itself', () => {
    for (const size of [4, 8, 16]) {
      for (const [a, b] of standardSeedPairs(size)) {
        expect(a).not.toBe(b);
      }
    }
  });
});

describe('nextPowerOfTwo', () => {
  it('scales beyond 16 for algorithm use', () => {
    expect(nextPowerOfTwo(17)).toBe(32);
    expect(nextPowerOfTwo(32)).toBe(32);
  });
});
