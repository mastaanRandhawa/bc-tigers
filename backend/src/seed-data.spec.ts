import {
  MIRI_PIRI_DIVISIONS,
  VENUE_FIELDS,
} from '../prisma/data/miri-piri-2026';
import {
  MIRI_PIRI_MINI_DIVISIONS,
  MINI_VENUE_FIELDS,
} from '../prisma/data/miri-piri-mini-2026';

const ALL = [...MIRI_PIRI_DIVISIONS, ...MIRI_PIRI_MINI_DIVISIONS];
const ALL_FIELDS = [...VENUE_FIELDS, ...MINI_VENUE_FIELDS];

// Knockout/pool placeholders should never reach the seed (the generator filters
// them out so only registered teams remain). This mirrors that contract.
const PLACEHOLDER =
  /winner|loser|quarter|semi|\bfinal\b|match\s*\d|pool\s*[a-d]\b|\b1st\b|\b2nd\b|\b3rd\b|\btbd\b/i;

describe('MIRI_PIRI_DIVISIONS seed data', () => {
  it('has the full set of divisions with registered teams', () => {
    expect(MIRI_PIRI_DIVISIONS.length).toBeGreaterThanOrEqual(20);
    const totalTeams = MIRI_PIRI_DIVISIONS.reduce(
      (n, d) => n + d.teams.length,
      0,
    );
    expect(totalTeams).toBeGreaterThanOrEqual(100);
  });

  it('never lists a placeholder as a team', () => {
    const leaks: string[] = [];
    for (const d of ALL) {
      for (const t of d.teams) {
        if (PLACEHOLDER.test(t.name)) leaks.push(`${d.name}: ${t.name}`);
      }
    }
    expect(leaks).toEqual([]);
  });

  it('only schedules fixtures between registered teams in the division', () => {
    for (const d of ALL) {
      const teamSet = new Set(d.teams.map((t) => t.name.toLowerCase()));
      for (const m of d.matches) {
        expect(teamSet.has(m.home.toLowerCase())).toBe(true);
        expect(teamSet.has(m.away.toLowerCase())).toBe(true);
      }
    }
  });

  it('keeps combined display order unique and contiguous from zero', () => {
    const orders = ALL.map((d) => d.order).sort((a, b) => a - b);
    orders.forEach((o, i) => expect(o).toBe(i));
  });

  it('uses unique division slugs across main and mini sets', () => {
    const slugs = ALL.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('assigns every team to a declared pool when groups are enabled', () => {
    for (const d of MIRI_PIRI_DIVISIONS) {
      if (!d.groups_enabled) continue;
      expect(d.pools.length).toBeGreaterThan(0);
      for (const t of d.teams) {
        expect(t.pool).not.toBeNull();
        expect(d.pools).toContain(t.pool as string);
      }
    }
  });

  it('references known venue fields in every fixture that has one', () => {
    const fieldSet = new Set(ALL_FIELDS);
    for (const d of ALL) {
      for (const m of d.matches) {
        if (m.field) expect(fieldSet.has(m.field)).toBe(true);
      }
    }
  });
});
