/**
 * Adds knockout *placeholder* fixtures ("Winner of Match N" / "Loser of Match N")
 * to the already-seeded Miri Piri 2026 schedule, derived from the July-2026
 * tournament + mini PDFs.
 *
 * PLACEHOLDER KINDS SUPPORTED
 * ---------------------------
 * Each slot can reference either:
 *   • the WINNER/LOSER of one specific match
 *     (Match.home_source_match_id + home_source_outcome); or
 *   • a standings position — a pool rank "Pool A 1st" / "Pool B 2nd"
 *     (home_source_group_id + home_source_rank) or a whole-division rank "1st"
 *     (home_source_rank with no group). "Winner of Pool A" is pool rank 1.
 * Positional slots auto-fill once the referenced pool/division round-robin is
 * complete (MatchesService.resolvePositionalSlots).
 *
 * Game numbers (Match.round) are *per division*, so every source reference is
 * resolved within the placeholder's own division. A fixture is only created when
 * BOTH referenced source matches already exist in that division; otherwise it is
 * skipped and reported (this is why Premier/Gold/Silver semis & finals — which
 * point at quarter-finals that were never materialised — are not created).
 *
 * Safe to run repeatedly: a placeholder whose round already exists in the
 * division is updated in place (its source links are (re)wired) rather than
 * duplicated.
 *
 * Usage: ts-node --transpile-only prisma/patch-placeholders-2026.ts
 *
 * NOTE: the fixture table below was transcribed from low-quality PDF text and
 * should be eyeballed against the official schedule before this is run against
 * production. Each entry carries its source line for that review.
 */
import 'dotenv/config';
import { PrismaClient, type MatchSlotOutcome } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL!;
const isRemote =
  !connectionString.includes('localhost') &&
  !connectionString.includes('127.0.0.1');
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    ...(isRemote && { ssl: { rejectUnauthorized: false } }),
  }),
});

const TOURNAMENT_SLUG = 'miri-piri-2026';

/**
 * A match-side: a real team (by name), the winner/loser of another game, or a
 * standings position — a pool rank ("Pool A 1st") or a whole-division rank
 * ("1st", no pool).
 */
type Side =
  | { team: string }
  | { winnerOf: number }
  | { loserOf: number }
  | { pool: string; rank: number }
  | { rank: number };

interface Placeholder {
  div: string; // division slug
  game: number; // this fixture's own round (per-division game number)
  day: number; // 3=Fri 4=Sat 5=Sun (July 2026)
  hour: number;
  minute: number;
  field: string | null;
  home: Side;
  away: Side;
  note: string; // PDF provenance for review
}

/**
 * Representable placeholders: each side is a known real team, the winner/loser
 * of a game that exists in the SAME division, or a standings position (pool rank
 * or whole-division rank). Positional slots auto-fill once their pool/division
 * round-robin completes (see MatchesService.resolvePositionalSlots).
 */
const PLACEHOLDERS: Placeholder[] = [
  // ── Div 1 Gold · Pool C crossovers (sources 26/27 exist) ──────────────────
  { div: 'div-1-gold', game: 33, day: 4, hour: 10, minute: 30, field: 'NAP 4', home: { winnerOf: 26 }, away: { loserOf: 27 }, note: 'Gold G33: W26 vs L27' },
  { div: 'div-1-gold', game: 34, day: 4, hour: 10, minute: 30, field: 'NAP 8', home: { winnerOf: 27 }, away: { loserOf: 26 }, note: 'Gold G34: W27 vs L26' },

  // ── Div 2 Silver · pool crossovers (sources all exist) ────────────────────
  { div: 'div-2-silver', game: 43, day: 4, hour: 12, minute: 0, field: 'STRAWBERRY HILL', home: { winnerOf: 41 }, away: { loserOf: 42 }, note: 'Silver G43: W41 vs L42' },
  { div: 'div-2-silver', game: 44, day: 4, hour: 10, minute: 30, field: 'HJORTH 1', home: { winnerOf: 42 }, away: { loserOf: 41 }, note: 'Silver G44: W42 vs L41' },
  { div: 'div-2-silver', game: 47, day: 4, hour: 10, minute: 30, field: 'NAP 9', home: { winnerOf: 45 }, away: { loserOf: 46 }, note: 'Silver G47: W45 vs L46' },
  { div: 'div-2-silver', game: 48, day: 4, hour: 10, minute: 30, field: 'NAP 10', home: { winnerOf: 46 }, away: { loserOf: 45 }, note: 'Silver G48: W46 vs L45' },
  { div: 'div-2-silver', game: 51, day: 4, hour: 12, minute: 0, field: 'NAP 7', home: { winnerOf: 49 }, away: { loserOf: 50 }, note: 'Silver G51: W49 vs L50' },
  { div: 'div-2-silver', game: 52, day: 4, hour: 12, minute: 0, field: 'NAP 8', home: { winnerOf: 50 }, away: { loserOf: 49 }, note: 'Silver G52: W50 vs L49' },
  { div: 'div-2-silver', game: 55, day: 4, hour: 12, minute: 0, field: 'NAP 9', home: { winnerOf: 53 }, away: { loserOf: 54 }, note: 'Silver G55: W53 vs L54' },
  { div: 'div-2-silver', game: 56, day: 4, hour: 12, minute: 0, field: 'NAP 10', home: { winnerOf: 54 }, away: { loserOf: 53 }, note: 'Silver G56: W54 vs L53' },

  // ── Div 3 Bronze · Pool B (source 69 exists) ──────────────────────────────
  { div: 'div-3-bronze', game: 71, day: 4, hour: 13, minute: 30, field: 'NAP 8', home: { team: 'WEST HOUND' }, away: { loserOf: 69 }, note: 'Bronze G71: WEST HOUNDS FC vs L69' },

  // ── Recreational (source 73 exists) ───────────────────────────────────────
  { div: 'recreational', game: 75, day: 5, hour: 14, minute: 0, field: 'NAP MINI TURF 1', home: { team: 'RICK HENSEN FC' }, away: { loserOf: 73 }, note: 'Rec G75: RICK HENSEN FC vs L73' },

  // ── Boys U15 Div 3 (sources 121/122 exist) ────────────────────────────────
  { div: 'boys-u15-div-3', game: 123, day: 4, hour: 16, minute: 30, field: 'NAP 9', home: { team: 'AKAL' }, away: { loserOf: 122 }, note: 'U15D3 G123: AKAL vs L122' },
  { div: 'boys-u15-div-3', game: 124, day: 4, hour: 16, minute: 30, field: 'NAP 10', home: { team: 'AUSC AVTAR' }, away: { loserOf: 121 }, note: 'U15D3 G124: AUSC AVTAR vs L121' },

  // ── Boys U14 Div 1/2 (source 131/134 exist) ───────────────────────────────
  { div: 'boys-u14-div-1-2', game: 133, day: 4, hour: 18, minute: 0, field: 'NAP 3', home: { team: 'CHINA (KALME)' }, away: { winnerOf: 131 }, note: 'U14D12 G133: CHINA (KALME) vs W131' },
  { div: 'boys-u14-div-1-2', game: 135, day: 4, hour: 13, minute: 30, field: 'NAP 4', home: { team: 'BCT PUMAS 2012' }, away: { loserOf: 134 }, note: 'U14D12 G135: BCT PUMAS 2012 vs L134' },
  { div: 'boys-u14-div-1-2', game: 136, day: 4, hour: 18, minute: 0, field: 'NAP 10', home: { team: 'BCT PUMAS 2012' }, away: { winnerOf: 134 }, note: 'U14D12 G136: BCT PUMAS 2012 vs W134' },

  // ── Girls U15 Div 1 (source 177 exists) ───────────────────────────────────
  { div: 'girls-u15-div-1', game: 178, day: 4, hour: 9, minute: 0, field: 'NAP 9', home: { team: 'SFC PHOENIX 12' }, away: { loserOf: 177 }, note: 'GU15D1 G178: SFC PHOENIX 12 vs L177' },

  // ── Positional placeholders (pool rank / whole-division rank) ──────────────
  // Div 3 Bronze final: "Winner of Pool A vs Winner of Pool B" = each pool's 1st.
  { div: 'div-3-bronze', game: 72, day: 5, hour: 15, minute: 30, field: 'NAP 7', home: { pool: 'Pool A', rank: 1 }, away: { pool: 'Pool B', rank: 1 }, note: 'Bronze G72 final: Pool A 1st vs Pool B 1st' },

  // Over 40 semifinals + final.
  { div: 'over-40', game: 83, day: 5, hour: 9, minute: 0, field: null, home: { pool: 'Pool A', rank: 1 }, away: { pool: 'Pool B', rank: 2 }, note: 'Over40 G83 SF: Pool A 1st vs Pool B 2nd' },
  { div: 'over-40', game: 84, day: 5, hour: 9, minute: 0, field: 'NAP 5A', home: { pool: 'Pool B', rank: 1 }, away: { pool: 'Pool A', rank: 2 }, note: 'Over40 G84 SF: Pool B 1st vs Pool A 2nd' },
  { div: 'over-40', game: 85, day: 5, hour: 17, minute: 0, field: 'NAP 5A', home: { pool: 'Pool A', rank: 1 }, away: { pool: 'Pool B', rank: 1 }, note: 'Over40 G85 final: Pool A 1st vs Pool B 1st (Winner of Pool A/B)' },

  // Boys U14 Div 1/2 final: Winner of Pool A vs Winner of Pool B.
  { div: 'boys-u14-div-1-2', game: 137, day: 5, hour: 14, minute: 0, field: 'NAP 7', home: { pool: 'Pool A', rank: 1 }, away: { pool: 'Pool B', rank: 1 }, note: 'U14D12 G137 final: Pool A 1st vs Pool B 1st' },

  // Whole-division finals ("1st vs 2nd") in ungrouped round-robin divisions.
  { div: 'boys-u13-div-3', game: 159, day: 5, hour: 15, minute: 30, field: 'NAP 10', home: { rank: 1 }, away: { rank: 2 }, note: 'U13D3 G159 final: 1st vs 2nd' },
  { div: 'girls-u14-div-2', game: 185, day: 5, hour: 17, minute: 0, field: 'NAP 2', home: { rank: 1 }, away: { rank: 2 }, note: 'GU14D2 G185 final: 1st vs 2nd' },
];

/**
 * Real teams that appear in the PDFs but are absent from the seeded data. Added
 * (idempotently) so their knockout placeholders below can resolve. Surfaced by
 * the placeholder dry-run; not a full division-by-division team audit.
 */
const MISSING_TEAMS: { div: string; name: string; pool: string | null }[] = [
  { div: 'recreational', name: 'RICK HENSEN FC', pool: null },
  { div: 'boys-u14-div-1-2', name: 'BCT PUMAS 2012', pool: 'Pool B' },
];

function cupDate(day: number, hour: number, minute: number) {
  return new Date(2026, 6, day, hour, minute, 0);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Create a team + its division membership + a zeroed standing, if missing. */
async function ensureTeam(
  tournamentId: string,
  divSlug: string,
  name: string,
  pool: string | null,
): Promise<'created' | 'exists' | 'no-division' | 'no-pool'> {
  const division = await prisma.division.findFirst({
    where: { tournament_id: tournamentId, slug: divSlug },
    include: { groups: true },
  });
  if (!division) return 'no-division';

  const groupId = pool
    ? division.groups.find((g) => g.name === pool)?.id ?? null
    : null;
  if (pool && !groupId) return 'no-pool';

  const existing = await prisma.team.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      divisions: { some: { division_id: division.id } },
    },
    select: { id: true },
  });
  if (existing) return 'exists';

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const team = await prisma.team.create({
    data: {
      name,
      city: 'Surrey, BC',
      primary_color: division.primary_color ?? '#CA8A04',
      created_by: admin?.id,
    },
  });
  await prisma.teamDivision.create({
    data: {
      team_id: team.id,
      division_id: division.id,
      group_id: groupId,
      slug: slugify(`${divSlug}-${name}`),
    },
  });
  await prisma.standing.create({
    data: {
      division_id: division.id,
      group_id: groupId,
      team_id: team.id,
      rank: 0,
    },
  });
  return 'created';
}

interface Report {
  teamsAdded: string[];
  created: string[];
  updated: string[];
  skippedSourceMissing: string[];
  skippedTeamMissing: string[];
}

async function main() {
  const tournament = await prisma.tournament.findFirst({
    where: { slug: TOURNAMENT_SLUG },
  });
  if (!tournament) throw new Error(`Tournament ${TOURNAMENT_SLUG} not found`);

  const fields = await prisma.field.findMany({
    select: { id: true, name: true, venue_id: true },
  });
  const fieldIdByName = new Map(fields.map((f) => [f.name.toUpperCase(), f.id]));
  const venueIdByField = new Map(
    fields.map((f) => [f.name.toUpperCase(), f.venue_id]),
  );
  const firstVenue = await prisma.venue.findFirst({ select: { id: true } });

  const report: Report = {
    teamsAdded: [],
    created: [],
    updated: [],
    skippedSourceMissing: [],
    skippedTeamMissing: [],
  };

  // 1) Provision real teams that are missing (so their placeholders resolve).
  for (const t of MISSING_TEAMS) {
    const outcome = await ensureTeam(tournament.id, t.div, t.name, t.pool);
    if (outcome === 'created') {
      report.teamsAdded.push(`${t.name} → ${t.div}${t.pool ? ` · ${t.pool}` : ''}`);
    } else if (outcome !== 'exists') {
      report.skippedTeamMissing.push(
        `team ${t.name} → ${t.div}: ${outcome === 'no-division' ? 'division not found' : 'pool not found'}`,
      );
    }
  }

  // 2) Placeholder fixtures.
  for (const p of PLACEHOLDERS) {
    const division = await prisma.division.findFirst({
      where: { tournament_id: tournament.id, slug: p.div },
      select: { id: true },
    });
    if (!division) {
      report.skippedSourceMissing.push(`${p.note} — division ${p.div} not found`);
      continue;
    }

    // Resolve each side to a team, a match source, a standings position, or an error.
    const resolveSide = async (
      side: Side,
    ): Promise<
      | { teamId: string }
      | { sourceMatchId: string; outcome: MatchSlotOutcome }
      | { groupId: string | null; rank: number }
      | { error: string }
    > => {
      if ('team' in side) {
        const team = await prisma.team.findFirst({
          where: {
            name: { equals: side.team, mode: 'insensitive' },
            divisions: { some: { division_id: division.id } },
          },
          select: { id: true },
        });
        return team
          ? { teamId: team.id }
          : { error: `team "${side.team}" not in ${p.div}` };
      }
      if ('rank' in side) {
        // Positional source: whole-division rank, or a named pool's rank.
        if (!('pool' in side)) return { groupId: null, rank: side.rank };
        const group = await prisma.group.findFirst({
          where: { division_id: division.id, name: side.pool },
          select: { id: true },
        });
        return group
          ? { groupId: group.id, rank: side.rank }
          : { error: `pool "${side.pool}" not in ${p.div}` };
      }
      const sourceGame = 'winnerOf' in side ? side.winnerOf : side.loserOf;
      const outcome: MatchSlotOutcome = 'winnerOf' in side ? 'WINNER' : 'LOSER';
      const source = await prisma.match.findFirst({
        where: { division_id: division.id, round: sourceGame },
        select: { id: true },
      });
      return source
        ? { sourceMatchId: source.id, outcome }
        : { error: `source game ${sourceGame} not in ${p.div}` };
    };

    const home = await resolveSide(p.home);
    const away = await resolveSide(p.away);

    if ('error' in home || 'error' in away) {
      const errs = [
        'error' in home ? home.error : null,
        'error' in away ? away.error : null,
      ].filter(Boolean);
      const bucket = errs.some(
        (e) => e!.startsWith('source') || e!.startsWith('pool'),
      )
        ? report.skippedSourceMissing
        : report.skippedTeamMissing;
      bucket.push(`${p.note} — ${errs.join('; ')}`);
      continue;
    }

    const start = cupDate(p.day, p.hour, p.minute);
    const data = {
      tournament_id: tournament.id,
      division_id: division.id,
      home_team_id: 'teamId' in home ? home.teamId : null,
      away_team_id: 'teamId' in away ? away.teamId : null,
      home_source_match_id: 'sourceMatchId' in home ? home.sourceMatchId : null,
      home_source_outcome: 'outcome' in home ? home.outcome : null,
      away_source_match_id: 'sourceMatchId' in away ? away.sourceMatchId : null,
      away_source_outcome: 'outcome' in away ? away.outcome : null,
      home_source_group_id: 'rank' in home ? home.groupId : null,
      home_source_rank: 'rank' in home ? home.rank : null,
      away_source_group_id: 'rank' in away ? away.groupId : null,
      away_source_rank: 'rank' in away ? away.rank : null,
      scheduled_start: start,
      scheduled_end: new Date(start.getTime() + 105 * 60 * 1000),
      status: 'SCHEDULED' as const,
      round: p.game,
      match_type: 'Knockout',
      venue_id: p.field
        ? venueIdByField.get(p.field.toUpperCase()) ?? firstVenue?.id
        : firstVenue?.id,
      field_id: p.field ? fieldIdByName.get(p.field.toUpperCase()) ?? null : null,
    };

    // Wire an existing placeholder row in place, else create a new one.
    const existing = await prisma.match.findFirst({
      where: { division_id: division.id, round: p.game },
      select: { id: true },
    });
    if (existing) {
      await prisma.match.update({ where: { id: existing.id }, data });
      report.updated.push(p.note);
    } else {
      await prisma.match.create({ data });
      report.created.push(p.note);
    }
  }

  // ── Report ──────────────────────────────────────────────────────────────
  const line = (label: string, items: string[]) => {
    console.log(`\n${label} (${items.length}):`);
    for (const i of items) console.log(`  • ${i}`);
  };
  console.log('Placeholder patch — Miri Piri 2026');
  line('TEAMS ADDED', report.teamsAdded);
  line('CREATED', report.created);
  line('UPDATED (already existed, re-wired)', report.updated);
  line('SKIPPED — source match not in division', report.skippedSourceMissing);
  line('SKIPPED — team not in division', report.skippedTeamMissing);
  console.log(
    `\nDone. ${report.created.length} created, ${report.updated.length} updated, ` +
      `${report.skippedSourceMissing.length + report.skippedTeamMissing.length} skipped.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
