import {
  isPlaceholderTeam,
  collectTeams,
  type ParsedMatch,
} from '../prisma/data/schedule-utils';
import { MIRI_PIRI_2026_DIVISIONS } from '../prisma/data/miri-piri-2026';

describe('isPlaceholderTeam', () => {
  it.each([
    'Winner of Match 11',
    'Loser of Match 9',
    'Winner of Pool A',
    'Pool A 1st',
    'Pool B 2nd',
    'Quarter Finals 1',
    '1st Place',
    '2nd Place',
    'TBD',
  ])('treats "%s" as a placeholder', (label) => {
    expect(isPlaceholderTeam(label)).toBe(true);
  });

  it.each([
    'BCT Punjab FC',
    'Van City Pro',
    'SFC Liverpool', // contains "pool" but is a real team
    'BC Tigers 2011',
    'North Surrey Mustangs',
    'AUSC',
  ])('treats "%s" as a real team', (name) => {
    expect(isPlaceholderTeam(name)).toBe(false);
  });
});

describe('collectTeams', () => {
  it('excludes placeholder slots', () => {
    const matches = [
      { home: 'BCT Punjab FC', away: 'Van City Pro' },
      { home: 'Winner of Match 1', away: 'Pool A 1st' },
      { home: 'Van City Pro', away: '1st Place' },
    ] as ParsedMatch[];
    expect(collectTeams(matches)).toEqual(['BCT Punjab FC', 'Van City Pro']);
  });
});

describe('MIRI_PIRI_2026 seed data', () => {
  it('never lists a placeholder as a team', () => {
    const leaks: string[] = [];
    for (const d of MIRI_PIRI_2026_DIVISIONS) {
      for (const t of d.teams) {
        if (isPlaceholderTeam(t)) leaks.push(`${d.name}: ${t}`);
      }
    }
    expect(leaks).toEqual([]);
  });

  it('has divisions with real registered teams', () => {
    expect(MIRI_PIRI_2026_DIVISIONS.length).toBeGreaterThan(30);
    const totalTeams = MIRI_PIRI_2026_DIVISIONS.reduce(
      (n, d) => n + d.teams.length,
      0,
    );
    expect(totalTeams).toBeGreaterThan(200);
  });

  it('keeps every match slot resolvable (real team or placeholder)', () => {
    for (const d of MIRI_PIRI_2026_DIVISIONS) {
      const teamSet = new Set(d.teams.map((t) => t.toLowerCase()));
      for (const m of d.matches) {
        for (const side of [m.home, m.away]) {
          const ok = isPlaceholderTeam(side) || teamSet.has(side.toLowerCase());
          expect(ok).toBe(true);
        }
      }
    }
  });
});
