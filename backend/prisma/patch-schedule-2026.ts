/**
 * Full, idempotent reconciliation of the Miri Piri 2026 TOURNAMENT schedule
 * (U13–Open) against the official spreadsheet, driven by the auto-generated
 * data/miri-piri-fixtures-2026.ts.
 *
 * For every division it:
 *   1. ensures each real team exists (creates missing ones with a division
 *      membership, pool assignment, and a zeroed standing);
 *   2. upserts every fixture by (division, game number) — setting real teams and
 *      schedule, leaving placeholder/TBD slots empty for now;
 *   3. wires placeholder slots: WINNER/LOSER of a game → match source;
 *      "Pool A 1st" / "Winner of Pool A" → positional pool source; bare 1st/2nd
 *      → whole-division positional source. (A second pass, so forward references
 *      to later games resolve.)
 *
 * Positional/match-source slots auto-fill with real teams once their pool /
 * division round-robin completes (MatchesService.resolvePositionalSlots /
 * resolveDependentSlots).
 *
 * Safe to run repeatedly. Prints a reconciliation report.
 * Usage: ts-node --transpile-only prisma/patch-schedule-2026.ts
 *
 * NOTE: requires migration 20260629200000_match_positional_sources to be applied
 * first (it writes home_source_group_id / home_source_rank).
 */
import 'dotenv/config';
import { PrismaClient, Prisma, type MatchSlotOutcome } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  TOURNEY_TEAMS,
  TOURNEY_FIXTURES,
  MINI_TEAMS,
  MINI_FIXTURES,
  type SideSpec,
} from './data/miri-piri-fixtures-2026';

// Tournament (U13–Open) and mini (U5–U12) divisions use disjoint slugs, so the
// two datasets merge cleanly into one reconciliation pass.
const ALL_TEAMS = { ...TOURNEY_TEAMS, ...MINI_TEAMS };
const ALL_FIXTURES = [...TOURNEY_FIXTURES, ...MINI_FIXTURES];

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

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function cupDate(day: number, hour: number, minute: number) {
  return new Date(2026, 6, day, hour, minute, 0);
}
function matchTypeLabel(raw: string | null): string {
  if (!raw) return 'Round robin';
  const u = raw.toUpperCase();
  if (u.startsWith('POOL')) return 'Pool play';
  if (u.startsWith('QUARTER')) return 'Quarter-final';
  if (u.startsWith('SEMI')) return 'Semi-final';
  if (u.startsWith('FINAL')) return 'Final';
  return 'Round robin';
}
function poolNameFromType(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.toUpperCase().replace('POOLA', 'POOL A').match(/POOL\s*([A-D])/);
  return m ? `Pool ${m[1]}` : null;
}

const report = {
  orphansRemoved: [] as string[],
  divisionsCreated: [] as string[],
  teamsCreated: [] as string[],
  matchesCreated: [] as string[],
  matchesUpdated: 0,
  placeholdersWired: 0,
  unresolved: [] as string[],
};

/** Derive a human division name + metadata from a mini slug, e.g.
 *  girls-u11-12-div-2-3 → "Girls U11/12 Div 2/3", FEMALE, age "U11/12". */
function miniDivisionSpec(slug: string) {
  const m = slug.match(/^(boys|girls)-u([\d-]+?)(?:-div-([\d-]+))?$/);
  if (!m) return null;
  const gender = m[1] === 'boys' ? 'MALE' : 'FEMALE';
  const age = `U${m[2].replace(/-/g, '/')}`;
  const div = m[3] ? ` Div ${m[3].replace(/-/g, '/')}` : '';
  const name = `${m[1] === 'boys' ? 'Boys' : 'Girls'} ${age}${div}`;
  return { name, gender: gender as 'MALE' | 'FEMALE', age_group: age };
}

async function main() {
  const tournament = await prisma.tournament.findFirst({
    where: { slug: TOURNAMENT_SLUG },
    select: { id: true },
  });
  if (!tournament) throw new Error(`Tournament ${TOURNAMENT_SLUG} not found`);

  const fields = await prisma.field.findMany({
    select: { id: true, name: true, venue_id: true },
  });
  const fieldId = new Map(fields.map((f) => [f.name.toUpperCase(), f.id]));
  const fieldVenue = new Map(fields.map((f) => [f.name.toUpperCase(), f.venue_id]));
  const firstVenue = await prisma.venue.findFirst({ select: { id: true } });
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  // Cache of division → { id, groupIdByName, teamIdByName }.
  const divCache = new Map<
    string,
    {
      id: string;
      groups: Map<string, string>;
      teams: Map<string, string>;
      primaryColor: string | null;
    }
  >();

  async function loadDivision(slug: string) {
    if (divCache.has(slug)) return divCache.get(slug)!;
    const division = await prisma.division.findFirst({
      where: { tournament_id: tournament!.id, slug },
      select: {
        id: true,
        primary_color: true,
        groups: { select: { id: true, name: true } },
        team_memberships: {
          select: { slug: true, team: { select: { id: true } } },
        },
      },
    });
    if (!division) return null;
    const entry = {
      id: division.id,
      primaryColor: division.primary_color,
      groups: new Map(division.groups.map((g) => [g.name, g.id])),
      // Keyed by the division membership slug (e.g. "div-1-gold-akal-fc"), which
      // is the actual unique key. Display names carry intentional disambiguation
      // suffixes ("AKAL FC D1") that don't match the spreadsheet's clean names,
      // so we never match (or rename) by display name.
      teams: new Map(
        division.team_memberships.map((m) => [m.slug, m.team.id]),
      ),
    };
    divCache.set(slug, entry);
    return entry;
  }

  /** Division-scoped membership slug for a spreadsheet team name. */
  const memSlug = (divSlug: string, name: string) =>
    slugify(`${divSlug}-${name}`);

  // ── Pass -1: remove fully-dangling teams left by a previously failed run ──
  // (no division membership, matches, standings, players, events, or bracket
  // links — i.e. genuinely disconnected rows, safe to delete).
  const orphans = await prisma.team.findMany({
    where: {
      divisions: { none: {} },
      home_matches: { none: {} },
      away_matches: { none: {} },
      standings: { none: {} },
      players: { none: {} },
      match_events: { none: {} },
      bracket_home: { none: {} },
      bracket_away: { none: {} },
      bracket_winner: { none: {} },
    },
    select: { id: true, name: true },
  });
  if (orphans.length > 0) {
    await prisma.team.deleteMany({
      where: { id: { in: orphans.map((o) => o.id) } },
    });
    report.orphansRemoved.push(...orphans.map((o) => o.name));
  }

  // ── Pass 0: create any missing (mini) divisions ───────────────────────────
  const usfa = await prisma.pointFormat.findFirst({
    where: { slug: 'usfa-10-point' },
    select: { id: true },
  });
  for (const slug of Object.keys(ALL_TEAMS)) {
    const existing = await prisma.division.findFirst({
      where: { tournament_id: tournament.id, slug },
      select: { id: true },
    });
    if (existing) continue;
    const spec = miniDivisionSpec(slug);
    if (!spec || !usfa) {
      report.unresolved.push(
        `division ${slug} missing and not auto-creatable${usfa ? '' : ' (no USFA point format)'}`,
      );
      continue;
    }
    const maxOrder = await prisma.division.aggregate({
      where: { tournament_id: tournament.id },
      _max: { display_order: true },
    });
    const divData: Prisma.DivisionUncheckedCreateInput = {
      tournament_id: tournament.id,
      name: spec.name,
      slug,
      age_group: spec.age_group,
      gender: spec.gender,
      format: 'Round Robin',
      max_teams: 16,
      schedule_only: true,
      groups_enabled: false,
      display_order: (maxOrder._max.display_order ?? 0) + 1,
      point_format_id: usfa.id,
    };
    await prisma.division.create({ data: divData });
    report.divisionsCreated.push(`${spec.name} (${slug})`);
  }

  // ── Pass 1: ensure teams ──────────────────────────────────────────────────
  for (const [slug, teams] of Object.entries(ALL_TEAMS)) {
    const div = await loadDivision(slug);
    if (!div) {
      report.unresolved.push(`division ${slug} not found (teams)`);
      continue;
    }
    for (const t of teams) {
      const key = memSlug(slug, t.name);
      if (div.teams.has(key)) continue;
      const groupId = t.pool ? div.groups.get(t.pool) ?? null : null;
      // Team + membership + standing in one transaction so a failure can't leave
      // an orphan Team behind.
      const team = await prisma.$transaction(async (tx) => {
        const created = await tx.team.create({
          data: {
            name: t.name,
            city: 'Surrey, BC',
            primary_color: div.primaryColor ?? '#CA8A04',
            created_by: admin?.id,
          },
        });
        await tx.teamDivision.create({
          data: {
            team_id: created.id,
            division_id: div.id,
            group_id: groupId,
            slug: key,
          },
        });
        await tx.standing.create({
          data: { division_id: div.id, group_id: groupId, team_id: created.id, rank: 0 },
        });
        return created;
      });
      div.teams.set(key, team.id);
      report.teamsCreated.push(`${t.name} → ${slug}${t.pool ? ` · ${t.pool}` : ''}`);
    }
  }

  // ── Pass 2: upsert match rows (teams + schedule; placeholders left empty) ──
  for (const fx of ALL_FIXTURES) {
    const div = await loadDivision(fx.div);
    if (!div) {
      report.unresolved.push(`division ${fx.div} not found (game ${fx.label})`);
      continue;
    }
    const teamId = (side: SideSpec) =>
      side.kind === 'team'
        ? div.teams.get(memSlug(fx.div, side.name!)) ?? null
        : null;
    const start = cupDate(fx.day, fx.hour, fx.minute);
    const poolName = poolNameFromType(fx.matchType);
    const data = {
      tournament_id: tournament!.id,
      division_id: div.id,
      home_team_id: teamId(fx.home),
      away_team_id: teamId(fx.away),
      group_id: poolName ? div.groups.get(poolName) ?? null : null,
      scheduled_start: start,
      scheduled_end: new Date(start.getTime() + 105 * 60 * 1000),
      status: 'SCHEDULED' as const,
      round: fx.game,
      match_type: matchTypeLabel(fx.matchType),
      venue_id: fx.field
        ? fieldVenue.get(fx.field.toUpperCase()) ?? firstVenue?.id
        : firstVenue?.id,
      field_id: fx.field ? fieldId.get(fx.field.toUpperCase()) ?? null : null,
    };
    const existing = await prisma.match.findFirst({
      where: { division_id: div.id, round: fx.game },
      select: { id: true },
    });
    if (existing) {
      await prisma.match.update({ where: { id: existing.id }, data });
      report.matchesUpdated++;
    } else {
      await prisma.match.create({ data });
      report.matchesCreated.push(`${fx.div} g${fx.label}`);
    }
  }

  // ── Pass 3: wire placeholder sources (all rows now exist) ─────────────────
  for (const fx of ALL_FIXTURES) {
    const div = await loadDivision(fx.div);
    if (!div) continue;
    const self = await prisma.match.findFirst({
      where: { division_id: div.id, round: fx.game },
      select: { id: true },
    });
    if (!self) continue;

    const wire = async (side: SideSpec, which: 'home' | 'away') => {
      const set: Record<string, unknown> = {};
      if (side.kind === 'winner' || side.kind === 'loser') {
        const src = await prisma.match.findFirst({
          where: { division_id: div.id, round: side.game! },
          select: { id: true },
        });
        if (!src) {
          report.unresolved.push(
            `${fx.div} g${fx.label} ${which}: source game ${side.game} missing`,
          );
          return false;
        }
        set[`${which}_source_match_id`] = src.id;
        set[`${which}_source_outcome`] = (
          side.kind === 'winner' ? 'WINNER' : 'LOSER'
        ) as MatchSlotOutcome;
        return set;
      }
      if (side.kind === 'pool') {
        const gid = div.groups.get(side.pool!);
        if (!gid) {
          report.unresolved.push(
            `${fx.div} g${fx.label} ${which}: pool ${side.pool} missing`,
          );
          return false;
        }
        set[`${which}_source_group_id`] = gid;
        set[`${which}_source_rank`] = side.rank!;
        return set;
      }
      if (side.kind === 'divrank') {
        set[`${which}_source_rank`] = side.rank!;
        return set;
      }
      return false; // team or tbd — nothing to wire
    };

    const homeSet = await wire(fx.home, 'home');
    const awaySet = await wire(fx.away, 'away');
    const merged = { ...(homeSet || {}), ...(awaySet || {}) };
    if (Object.keys(merged).length > 0) {
      await prisma.match.update({ where: { id: self.id }, data: merged });
      if (homeSet) report.placeholdersWired++;
      if (awaySet) report.placeholdersWired++;
    }
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const line = (label: string, items: string[]) => {
    console.log(`\n${label} (${items.length}):`);
    for (const i of items) console.log(`  • ${i}`);
  };
  console.log('Schedule reconciliation — Miri Piri 2026 (tournament + mini)');
  line('ORPHAN TEAMS REMOVED', report.orphansRemoved);
  line('DIVISIONS CREATED', report.divisionsCreated);
  line('TEAMS CREATED', report.teamsCreated);
  line('MATCH ROWS CREATED', report.matchesCreated);
  console.log(`\nMATCH ROWS UPDATED (already existed): ${report.matchesUpdated}`);
  console.log(`PLACEHOLDER SLOTS WIRED: ${report.placeholdersWired}`);
  line('UNRESOLVED', report.unresolved);
  console.log(
    `\nDone. ${report.divisionsCreated.length} divisions created, ` +
      `${report.teamsCreated.length} teams created, ` +
      `${report.matchesCreated.length} matches created, ` +
      `${report.matchesUpdated} updated, ${report.placeholdersWired} placeholder slots wired, ` +
      `${report.unresolved.length} unresolved.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
