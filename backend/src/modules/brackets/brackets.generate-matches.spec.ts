jest.mock('../../prisma/prisma', () => ({
  __esModule: true,
  default: {
    division: { findUnique: jest.fn() },
    tournament: {
      findUnique: jest.fn().mockResolvedValue({
        status: 'ACTIVE',
        admin_editing_enabled: true,
        name: 'Cup',
      }),
    },
    teamDivision: { findMany: jest.fn() },
    bracketNode: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    match: {
      aggregate: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import prisma from '../../prisma/prisma';
import { asMockedPrisma } from '../../test-utils/prisma-mock';
import { BracketsService } from './brackets.service';

const mockPrisma = asMockedPrisma(prisma);

const division = {
  id: 'div-1',
  tournament_id: 't1',
  tournament: { id: 't1', start_date: new Date('2026-07-03T09:00:00Z') },
};

function membership(id: string) {
  return {
    slug: id,
    division_id: 'div-1',
    team: {
      id,
      name: id,
      players: Array.from({ length: 5 }, () => ({ id: `${id}-p`, active: true })),
    },
  };
}

describe('BracketsService.generate — auto-created linked matches', () => {
  const gateway = { emitBracketUpdated: jest.fn() };
  const audit = { log: jest.fn() };
  const engine = {
    assertStructureEditable: jest.fn().mockResolvedValue(undefined),
    createNodes: jest.fn().mockResolvedValue(undefined),
    getFullBracket: jest.fn().mockResolvedValue([]),
  };
  const matchesService = {
    reconcileMatchSlots: jest.fn(),
  };
  const service = new BracketsService(
    gateway as never,
    audit as never,
    engine as never,
    matchesService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.division.findUnique.mockResolvedValue(division);
    mockPrisma.teamDivision.findMany.mockResolvedValue([
      membership('t1'),
      membership('t2'),
      membership('t3'),
      membership('t4'),
    ]);
    mockPrisma.bracketNode.findMany.mockResolvedValue([]); // no prior linked matches
    mockPrisma.bracketNode.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.match.aggregate.mockResolvedValue({ _max: { round: null } });
    mockPrisma.match.create.mockImplementation((args: { data: unknown }) => args.data);
    mockPrisma.$transaction.mockResolvedValue([]);
  });

  it('creates one linked knockout match per bracket node with correct source pointers', async () => {
    await service.generate('div-1');

    // 4 teams → 2 semis + final + third place = 4 nodes/matches.
    const creates = mockPrisma.match.create.mock.calls.map(
      (c) => c[0].data as Record<string, unknown>,
    );
    expect(creates).toHaveLength(4);

    // Every created match is a scheduled knockout game in the division.
    for (const d of creates) {
      expect(d.match_type).toBe('Knockout');
      expect(d.status).toBe('SCHEDULED');
      expect(d.division_id).toBe('div-1');
      expect(d.tournament_id).toBe('t1');
      expect(d.scheduled_start).toBeInstanceOf(Date);
    }

    // Game numbers are unique.
    const rounds = creates.map((d) => d.round);
    expect(new Set(rounds).size).toBe(4);

    // Semis are the first round: real teams (or null), no source pointers.
    const semis = creates.filter(
      (d) => d.home_source_match_id == null && d.away_source_match_id == null,
    );
    expect(semis).toHaveLength(2);
    const semiIds = semis.map((d) => d.id);

    // Final = winners of both semis.
    const final = creates.find(
      (d) =>
        d.home_source_outcome === 'WINNER' && d.away_source_outcome === 'WINNER',
    );
    expect(final).toBeDefined();
    expect(semiIds).toContain(final!.home_source_match_id);
    expect(semiIds).toContain(final!.away_source_match_id);

    // Third place = losers of both semis.
    const third = creates.find(
      (d) =>
        d.home_source_outcome === 'LOSER' && d.away_source_outcome === 'LOSER',
    );
    expect(third).toBeDefined();
    expect(semiIds).toContain(third!.home_source_match_id);
    expect(semiIds).toContain(third!.away_source_match_id);

    // Each node is linked to its match.
    expect(mockPrisma.bracketNode.update).toHaveBeenCalledTimes(4);
  });

  it('numbers knockout games after existing round-robin fixtures', async () => {
    mockPrisma.match.aggregate.mockResolvedValue({ _max: { round: 12 } });

    await service.generate('div-1');

    const rounds = mockPrisma.match.create.mock.calls
      .map((c) => (c[0].data as { round: number }).round)
      .sort((a, b) => a - b);
    expect(rounds[0]).toBe(13);
    expect(Math.min(...rounds)).toBeGreaterThan(12);
  });

  it('deletes previously auto-created knockout matches on regenerate', async () => {
    mockPrisma.bracketNode.findMany.mockResolvedValue([
      { match_id: 'old-1' },
      { match_id: 'old-2' },
      { match_id: null },
    ]);

    await service.generate('div-1');

    expect(mockPrisma.match.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['old-1', 'old-2'] } },
    });
  });

  it('rejects manual winner advancement from the bracket', async () => {
    // The match is the single source of truth — no hand-picking winners on the
    // bracket. The default source is 'manual', which must be rejected before any
    // engine work happens.
    await expect(service.advance('node-1', 'team-1')).rejects.toThrow(
      /completing the match/i,
    );
    await expect(
      service.advance('node-1', 'team-1', 'manual'),
    ).rejects.toThrow(/completing the match/i);
  });
});
