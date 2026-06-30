import {
  ordinal,
  slotLabel,
  positionalLabel,
  attachSlotLabels,
} from './slot-labels';

describe('ordinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [10, '10th'],
    [11, '11th'], // the teens are always "th", not "st/nd/rd"
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [22, '22nd'],
    [23, '23rd'],
    [101, '101st'],
    [111, '111th'],
  ])('%i → %s', (n, expected) => {
    expect(ordinal(n)).toBe(expected);
  });
});

describe('slotLabel (winner/loser of a match)', () => {
  it('labels the winner of a numbered game', () => {
    expect(slotLabel('WINNER', { round: 5 })).toBe('Winner of Game 5');
  });

  it('labels the loser of a numbered game', () => {
    expect(slotLabel('LOSER', { round: 12 })).toBe('Loser of Game 12');
  });

  it('falls back to "TBD" when the source game has no number yet', () => {
    expect(slotLabel('WINNER', { round: null })).toBe('Winner of TBD');
  });

  it('returns null when there is no outcome or no source', () => {
    expect(slotLabel(null, { round: 5 })).toBeNull();
    expect(slotLabel('WINNER', null)).toBeNull();
  });
});

describe('positionalLabel (standings position)', () => {
  it('labels a pool rank with the pool name', () => {
    expect(positionalLabel({ name: 'Pool A' }, 1)).toBe('Pool A 1st');
    expect(positionalLabel({ name: 'Pool B' }, 2)).toBe('Pool B 2nd');
  });

  it('labels a whole-division rank with no pool', () => {
    expect(positionalLabel(null, 1)).toBe('1st');
    expect(positionalLabel(undefined, 2)).toBe('2nd');
  });

  it('returns null when there is no rank', () => {
    expect(positionalLabel({ name: 'Pool A' }, null)).toBeNull();
  });
});

describe('attachSlotLabels', () => {
  const base = {
    home_source_outcome: null,
    away_source_outcome: null,
    home_source: null,
    away_source: null,
    home_source_rank: null,
    away_source_rank: null,
    home_source_group: null,
    away_source_group: null,
    home_team: null,
    away_team: null,
  };

  it('gives a real team a null label and never overrides it', () => {
    const out = attachSlotLabels({
      ...base,
      home_team: { name: 'BC Tigers' },
      home_source_outcome: 'WINNER',
      home_source: { round: 5 },
    });
    expect(out.home_label).toBeNull();
  });

  it('labels a match-source slot', () => {
    const out = attachSlotLabels({
      ...base,
      away_source_outcome: 'LOSER',
      away_source: { round: 7 },
    });
    expect(out.away_label).toBe('Loser of Game 7');
  });

  it('labels a positional slot when no match source is present', () => {
    const out = attachSlotLabels({
      ...base,
      home_source_group: { name: 'Pool A' },
      home_source_rank: 1,
      away_source_rank: 2, // whole-division
    });
    expect(out.home_label).toBe('Pool A 1st');
    expect(out.away_label).toBe('2nd');
  });

  it('prefers the match-source label over a positional one if both are set', () => {
    const out = attachSlotLabels({
      ...base,
      home_source_outcome: 'WINNER',
      home_source: { round: 3 },
      home_source_group: { name: 'Pool A' },
      home_source_rank: 1,
    });
    expect(out.home_label).toBe('Winner of Game 3');
  });

  it('leaves both labels null for a fully-resolved real fixture', () => {
    const out = attachSlotLabels({
      ...base,
      home_team: { name: 'A' },
      away_team: { name: 'B' },
    });
    expect(out.home_label).toBeNull();
    expect(out.away_label).toBeNull();
  });
});
