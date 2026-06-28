/**
 * Creates (or recreates) a fully simulated TEMP Premier division for QA:
 *   • 8 temp teams with rosters
 *   • Round-robin pool play (completed + live + scheduled) with goal/card events
 *   • USFA 10-point standings recalculated
 *   • Knockout bracket seeded from standings, QF/SF partially played
 *
 * Safe to re-run — drops the previous temp division first.
 * Usage: ts-node --transpile-only prisma/patch-temp-prem-demo.ts
 */
import 'dotenv/config';
import { PrismaClient, type MatchStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { computeGroupedStandings } from '../src/engine/standings';
import {
  mapPrismaMatchToResult,
  toTournamentConfig,
} from '../src/engine/point-format-mapper';
import { BracketEngine } from '../src/modules/brackets/bracket-engine/bracket-engine';
import {
  planBracket,
  planToNodeDrafts,
} from '../src/modules/brackets/scheduling/bracket-planner';
import { buildFirstRoundSlots } from '../src/modules/brackets/scheduling/seed-order';

const TEMP_SLUG = 'temp-premier-demo';
const TEMP_NAME = '[TEMP] Premier Demo';

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

const TEAM_NAMES = [
  'TEMP FC Alpha',
  'TEMP FC Bravo',
  'TEMP FC Charlie',
  'TEMP FC Delta',
  'TEMP FC Echo',
  'TEMP FC Foxtrot',
  'TEMP FC Golf',
  'TEMP FC Hotel',
];

const PALETTE = [
  '#F48735', '#7C3AED', '#0D9488', '#DC2626', '#2563EB', '#CA8A04', '#DB2777', '#4F46E5',
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function cupDate(day: number, hour: number, minute = 0) {
  return new Date(2026, 6, day, hour, minute, 0);
}

function roundRobinPairs(teamIds: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < teamIds.length - 1; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairs.push([teamIds[i], teamIds[j]]);
    }
  }
  return pairs;
}

/** Deterministic scoreline biased so lower-index teams tend to win (Alpha on top). */
function poolScore(homeIdx: number, awayIdx: number, game: number): [number, number] {
  const strength = (idx: number) => 8 - idx;
  const home = strength(homeIdx) + (game % 3);
  const away = strength(awayIdx) + ((game + 1) % 2);
  if (home === away) return [Math.min(4, home + 1), Math.min(3, away)];
  return home > away
    ? [Math.min(4, home), Math.min(3, away)]
    : [Math.min(3, home), Math.min(4, away)];
}

async function recalculateStandings(divisionId: string) {
  const [matches, division, teams] = await Promise.all([
    prisma.match.findMany({
      where: { division_id: divisionId, status: 'COMPLETED' },
    }),
    prisma.division.findUniqueOrThrow({
      where: { id: divisionId },
      include: { point_format: true },
    }),
    prisma.team.findMany({
      where: { division_id: divisionId },
      select: { id: true, group_id: true },
    }),
  ]);

  const results = matches.map(mapPrismaMatchToResult);
  const config = toTournamentConfig(division.point_format);
  const rows = computeGroupedStandings(
    teams.map((t) => ({ id: t.id, groupId: t.group_id })),
    results,
    config,
    division.groups_enabled,
  );

  await prisma.$transaction(
    rows.map((row) =>
      prisma.standing.upsert({
        where: { division_id_team_id: { division_id: divisionId, team_id: row.teamId } },
        create: {
          division_id: divisionId,
          team_id: row.teamId,
          group_id: row.groupId,
          played: row.played,
          wins: row.wins,
          draws: row.draws,
          losses: row.losses,
          goals_for: row.goalsFor,
          goals_against: row.goalsAgainst,
          goal_difference: row.goalDifference,
          points: row.points,
          rank: row.rank,
        },
        update: {
          group_id: row.groupId,
          played: row.played,
          wins: row.wins,
          draws: row.draws,
          losses: row.losses,
          goals_for: row.goalsFor,
          goals_against: row.goalsAgainst,
          goal_difference: row.goalDifference,
          points: row.points,
          rank: row.rank,
        },
      }),
    ),
  );
}

async function addGoalEvents(
  matchId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
  playersByTeam: Map<string, { id: string; position: string | null }[]>,
) {
  let minute = 12;
  for (let g = 0; g < homeScore; g++) {
    const roster = playersByTeam.get(homeTeamId) ?? [];
    const scorer = roster.find((p) => p.position === 'ST') ?? roster[0];
    if (scorer) {
      await prisma.matchEvent.create({
        data: { match_id: matchId, team_id: homeTeamId, player_id: scorer.id, type: 'GOAL', minute: minute },
      });
    }
    minute += 17;
  }
  minute = 18;
  for (let g = 0; g < awayScore; g++) {
    const roster = playersByTeam.get(awayTeamId) ?? [];
    const scorer = roster.find((p) => p.position === 'ST') ?? roster[0];
    if (scorer) {
      await prisma.matchEvent.create({
        data: { match_id: matchId, team_id: awayTeamId, player_id: scorer.id, type: 'GOAL', minute: minute },
      });
    }
    minute += 19;
  }
}

async function main() {
  console.log(`Creating ${TEMP_NAME} (full simulation)...`);

  const tournament = await prisma.tournament.findUnique({ where: { slug: 'miri-piri-2026' } });
  if (!tournament) throw new Error('Tournament miri-piri-2026 not found');

  const usfa = await prisma.pointFormat.findUnique({ where: { slug: 'usfa-10-point' } });
  if (!usfa) throw new Error('USFA point format not found');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const venue = await prisma.venue.findUnique({ where: { slug: 'newton-athletic-park' } });
  const field =
    (await prisma.field.findFirst({ where: { name: 'NAP 1' } })) ??
    (await prisma.field.findFirst({ where: { venue_id: venue?.id } }));
  if (!venue || !field) throw new Error('Venue/field not found');

  const tournamentId = tournament.id;
  const venueId = venue.id;
  const fieldId = field.id;

  // Drop previous temp division (cascades teams, matches, bracket, standings).
  const existing = await prisma.division.findFirst({
    where: { tournament_id: tournamentId, slug: TEMP_SLUG },
  });
  if (existing) {
    await prisma.division.delete({ where: { id: existing.id } });
    console.log('  Removed previous temp division.');
  }

  const division = await prisma.division.create({
    data: {
      tournament_id: tournamentId,
      name: TEMP_NAME,
      slug: TEMP_SLUG,
      age_group: 'Adult',
      gender: 'MALE',
      max_teams: 8,
      format: '11-a-side · Round Robin + Knockout (demo)',
      point_format_id: usfa.id,
      primary_color: '#DC2626',
      accent_color: '#FEE2E2',
      schedule_only: false,
      groups_enabled: false,
      display_order: 999,
    },
  });

  const teamIdByName = new Map<string, string>();
  const playersByTeam = new Map<string, { id: string; position: string | null }[]>();

  for (let i = 0; i < TEAM_NAMES.length; i++) {
    const name = TEAM_NAMES[i];
    const team = await prisma.team.create({
      data: {
        division_id: division.id,
        name,
        slug: slugify(`${TEMP_SLUG}-${name}`),
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${PALETTE[i].replace('#', '')}&color=ffffff&bold=true&rounded=true&size=256&format=png`,
        city: 'Surrey, BC',
        founded_year: 2020,
        primary_color: PALETTE[i],
        created_by: admin?.id ?? null,
      },
    });
    teamIdByName.set(name, team.id);

    const positions = ['GK', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'ST'];
    const roster: { id: string; position: string | null }[] = [];
    for (let p = 0; p < 12; p++) {
      const player = await prisma.player.create({
        data: {
          team_id: team.id,
          first_name: ['Alex', 'Jordan', 'Sam', 'Chris', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Drew', 'Quinn', 'Avery'][p],
          last_name: name.split(' ').pop() ?? 'Demo',
          slug: slugify(`${TEMP_SLUG}-${name}-p${p}`),
          jersey_number: p + 1,
          preferred_position: positions[p],
          dob: new Date(1995 + (i % 5), (p * 2) % 12, 10),
          active: true,
        },
      });
      roster.push({ id: player.id, position: player.preferred_position });
    }
    playersByTeam.set(team.id, roster);

    await prisma.standing.create({
      data: { division_id: division.id, team_id: team.id, rank: 0 },
    });
  }

  const teamIds = TEAM_NAMES.map((n) => teamIdByName.get(n)!);
  const idxById = new Map(teamIds.map((id, i) => [id, i]));

  // --- Pool play: full round-robin (28 games). Last 3 are live/scheduled; rest completed.
  const pairs = roundRobinPairs(teamIds);
  let gameNum = 900;
  let completed = 0;
  let live = 0;
  let scheduled = 0;

  for (let pi = 0; pi < pairs.length; pi++) {
    const [homeId, awayId] = pairs[pi];
    const homeIdx = idxById.get(homeId)!;
    const awayIdx = idxById.get(awayId)!;
    let status: MatchStatus;
    let homeScore = 0;
    let awayScore = 0;

    if (pi >= pairs.length - 3) {
      if (pi === pairs.length - 3) {
        status = 'LIVE';
        homeScore = 1;
        awayScore = 0;
        live++;
      } else {
        status = 'SCHEDULED';
        scheduled++;
      }
    } else {
      status = 'COMPLETED';
      [homeScore, awayScore] = poolScore(homeIdx, awayIdx, pi);
      completed++;
    }

    const day = pi < 14 ? 4 : 5;
    const hour = 9 + Math.floor((pi % 8) * 1.5);
    const match = await prisma.match.create({
      data: {
        tournament_id: tournamentId,
        division_id: division.id,
        home_team_id: homeId,
        away_team_id: awayId,
        venue_id: venueId,
        field_id: fieldId,
        scheduled_start: cupDate(day, hour, (pi % 2) * 30),
        scheduled_end: cupDate(day, hour + 1, 45),
        status,
        round: gameNum++,
        match_type: 'Pool play',
        home_score: homeScore,
        away_score: awayScore,
        stream_url: status === 'LIVE' ? 'https://www.youtube.com/embed/live_stream' : undefined,
      },
    });

    if (status === 'COMPLETED' || status === 'LIVE') {
      await addGoalEvents(match.id, homeId, awayId, homeScore, awayScore, playersByTeam);
      if (pi % 5 === 0) {
        await prisma.matchEvent.create({
          data: {
            match_id: match.id,
            team_id: homeId,
            player_id: playersByTeam.get(homeId)?.[1]?.id,
            type: 'YELLOW_CARD',
            minute: 55,
          },
        });
      }
    }
  }

  await recalculateStandings(division.id);
  const standingsPreview = await prisma.standing.findMany({
    where: { division_id: division.id },
    include: { team: true },
    orderBy: { rank: 'asc' },
  });
  console.log('  Standings (top 4):');
  for (const s of standingsPreview.slice(0, 4)) {
    console.log(`    #${s.rank} ${s.team.name} — ${s.points} pts (${s.wins}W-${s.draws}D-${s.losses}L, GF ${s.goals_for}/GA ${s.goals_against})`);
  }

  // --- Knockout bracket (8 teams → QF) seeded from standings.
  const engine = new BracketEngine();
  const eligible = standingsPreview.map((s) => ({
    id: s.team_id,
    name: s.team!.name,
    slug: s.team!.slug,
    division_id: division.id,
    playerCount: 12,
  }));

  const plan = planBracket({ divisionId: division.id, teams: eligible });
  if (!plan.validation.valid) {
    throw new Error(`Bracket plan invalid: ${plan.validation.errors.join(', ')}`);
  }

  await engine.createNodes(planToNodeDrafts(plan));
  const teamIdsByRank = standingsPreview.map((s) => s.team_id);
  const slots = buildFirstRoundSlots(teamIdsByRank, plan.bracketSize);

  let nodes = await engine.loadNodes(division.id);
  const firstStage = plan.firstStage;
  const firstRound = nodes
    .filter((n) => n.stage === firstStage)
    .sort((a, b) => a.position - b.position);

  for (let i = 0; i < firstRound.length; i++) {
    await prisma.bracketNode.update({
      where: { id: firstRound[i].id },
      data: {
        home_team_id: slots[i].homeTeamId,
        away_team_id: slots[i].awayTeamId,
        winner_id: null,
        auto_advanced: false,
        status: 'PENDING',
      },
    });
  }

  await engine.runPropagateByes(division.id, firstStage);
  nodes = await engine.loadNodes(division.id);

  async function createKnockoutMatch(
    nodeId: string,
    status: MatchStatus,
    homeScore: number,
    awayScore: number,
    game: number,
    day: number,
    hour: number,
  ) {
    const node = await prisma.bracketNode.findUniqueOrThrow({
      where: { id: nodeId },
      include: { home_team: true, away_team: true },
    });
    if (!node.home_team_id || !node.away_team_id) return null;

    const match = await prisma.match.create({
      data: {
        tournament_id: tournamentId,
        division_id: division.id,
        home_team_id: node.home_team_id,
        away_team_id: node.away_team_id,
        venue_id: venueId,
        field_id: fieldId,
        scheduled_start: cupDate(day, hour),
        scheduled_end: cupDate(day, hour + 1, 45),
        status,
        round: game,
        match_type: 'Knockout',
        home_score: homeScore,
        away_score: awayScore,
      },
    });

    await prisma.bracketNode.update({
      where: { id: nodeId },
      data: { match_id: match.id },
    });

    if (status === 'COMPLETED' || status === 'LIVE') {
      await addGoalEvents(
        match.id,
        node.home_team_id,
        node.away_team_id,
        homeScore,
        awayScore,
        playersByTeam,
      );
    }

    if (status === 'COMPLETED') {
      const winnerId =
        homeScore > awayScore ? node.home_team_id : node.away_team_id;
      await engine.applySetWinner(nodeId, winnerId, 'match');
    }

    return match;
  }

  const qfNodes = nodes
    .filter((n) => n.stage === 'QUARTER_FINAL')
    .sort((a, b) => a.position - b.position);

  // QF: 2 completed (bracket advances to SF), 1 live, 1 scheduled.
  if (qfNodes[0]?.home_team_id && qfNodes[0]?.away_team_id) {
    await createKnockoutMatch(qfNodes[0].id, 'COMPLETED', 2, 1, 960, 5, 10);
  }
  if (qfNodes[1]?.home_team_id && qfNodes[1]?.away_team_id) {
    await createKnockoutMatch(qfNodes[1].id, 'COMPLETED', 3, 0, 961, 5, 12);
  }
  if (qfNodes[2]?.home_team_id && qfNodes[2]?.away_team_id) {
    await createKnockoutMatch(qfNodes[2].id, 'LIVE', 1, 1, 962, 5, 14);
  }
  if (qfNodes[3]?.home_team_id && qfNodes[3]?.away_team_id) {
    await createKnockoutMatch(qfNodes[3].id, 'SCHEDULED', 0, 0, 963, 5, 16);
  }

  // Reload and create SF match for the first semi that's ready (both teams set).
  nodes = await engine.loadNodes(division.id);
  const sfNodes = nodes
    .filter((n) => n.stage === 'SEMI_FINAL')
    .sort((a, b) => a.position - b.position);

  if (sfNodes[0]?.home_team_id && sfNodes[0]?.away_team_id) {
    await createKnockoutMatch(sfNodes[0].id, 'SCHEDULED', 0, 0, 964, 5, 18);
  }

  // Mark tournament active so live scores / hub reflect demo state.
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: 'ACTIVE' },
  });

  console.log(`  Pool: ${completed} completed, ${live} live, ${scheduled} scheduled.`);
  console.log(`  Bracket: QF seeded from standings; 2 QF done, 1 QF live, SF + Final pending.`);
  console.log(`\nDone. Open /tournaments/miri-piri-2026/divisions/${TEMP_SLUG}`);
  console.log('  Re-run this script anytime to reset the demo division.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
