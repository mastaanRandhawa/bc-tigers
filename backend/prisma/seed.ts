import 'dotenv/config';
import { PrismaClient, type Gender, type MatchStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { computeStandings } from '../src/engine/standings';
import {
  buildFairPlayMap,
  mapPrismaMatchToResult,
  toTournamentConfig,
} from '../src/engine/point-format-mapper';
import {
  MIRI_PIRI_2026_DIVISIONS,
  MIRI_PIRI_2026_FIELDS,
  assertValidMiriPiri2026Data,
  type MiriPiriDivisionSeed,
} from './data/miri-piri-2026';
import { isPlaceholderTeam } from './data/schedule-utils';

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

const ADULT_PLAYERS_PER_TEAM = 15;
const YOUTH_PLAYERS_PER_TEAM = 12;
const REC_PLAYERS_PER_TEAM = 10;
const MINI_PLAYERS_PER_TEAM = 8;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized.split('').map((c) => `${c}${c}`).join('')
      : normalized;
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function teamLogoUrl(name: string, primaryColor: string) {
  const { r, g, b } = hexToRgb(primaryColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = luminance > 0.6 ? '111827' : 'ffffff';
  const params = new URLSearchParams({
    name,
    background: primaryColor.replace('#', ''),
    color: textColor,
    bold: 'true',
    rounded: 'true',
    size: '256',
    format: 'png',
  });
  return `https://ui-avatars.com/api/?${params.toString()}`;
}

/** Miri Piri 2026 — July 3–5 (Pacific local) */
function cupDate(day: number, hour = 10, minute = 0) {
  return new Date(2026, 6, day, hour, minute, 0);
}

const TOURNAMENT_RULES = `14th Annual Miri Piri Soccer Tournament (Miri Piri Canada Soccer Cup)

Host: BC Tigers FC (in association with BC Soccer)
Dates: July 3, 4, and 5, 2026 — Friday evening kickoff July 3
Location: Newton Athletic Park, 7395 128 St, Surrey, BC V3W 2M7

Total prize pool: $70,000 (all prize money sponsored)
Early bird registration deadline: May 15, 2026
District team entry deadline: June 15, 2026
Final registration deadline: June 15, 2026

Division rules:
• Maximum 16 teams per division
• Age groups: Youth U6–U19, Adults, Recreational, and Masters divisions
• Youth U6–U19: minimum 3 games guaranteed
• Youth U13–U18: participation medals for all players

Event perks:
• Free appetizers / lunch for all on Saturday & Sunday
• Free parking available
• Refreshments available

Contact: bctigersfc@gmail.com | www.bctigers.com
Ajinderpal Mangat (604) 240-9742
Rakesh Kumar — Youth Coordinator (778) 233-7338
Vicky Virk — Adult Coordinator (604) 760-3506`;

// Each field belongs to its real-world park. Only "NAP …" fields are at Newton
// Athletic Park; Bear Creek, Strawberry Hill, and Hjorth Road are separate venues.
const VENUES = [
  {
    key: 'nap',
    name: 'Newton Athletic Park',
    slug: 'newton-athletic-park',
    address: '7395 128 St',
    city: 'Surrey, BC V3W 2M7',
    parking_info: 'Free parking available on site. Enter from 128 Street.',
  },
  {
    key: 'bear-creek',
    name: 'Bear Creek Park',
    slug: 'bear-creek-park',
    address: '13750 88 Ave',
    city: 'Surrey, BC V3W 3K8',
    parking_info: 'Free parking on site off 88 Avenue and King George Blvd.',
  },
  {
    key: 'strawberry-hill',
    name: 'Strawberry Hill Park',
    slug: 'strawberry-hill-park',
    address: '12345 75A Ave',
    city: 'Surrey, BC V3W 0M9',
    parking_info: 'Free parking on site.',
  },
  {
    key: 'hjorth-road',
    name: 'Hjorth Road Park',
    slug: 'hjorth-road-park',
    address: '9260 Hjorth Rd',
    city: 'Surrey, BC V3V 1T9',
    parking_info: 'Free parking on site.',
  },
] as const;

type VenueKey = (typeof VENUES)[number]['key'];

/** Resolve which park a field name belongs to. NAP (and anything else) → Newton. */
function venueKeyForField(name: string): VenueKey {
  const n = name.toUpperCase();
  if (n.startsWith('BEAR')) return 'bear-creek';
  if (n.startsWith('STRAWBERRY')) return 'strawberry-hill';
  if (n.startsWith('HJORTH') || n.startsWith('HORTH')) return 'hjorth-road';
  return 'nap';
}

function fieldSurface(name: string): string {
  if (name.includes('Mini Turf')) return 'Mini turf';
  if (name.includes('Turf') || name.includes('HJORTH') || name.includes('Hjorth')) return 'Turf';
  return 'Natural grass';
}

const FIELDS = MIRI_PIRI_2026_FIELDS.map((name) => ({
  name,
  surface: fieldSurface(name),
  venueKey: venueKeyForField(name),
}));

const REFEREES = [
  { first_name: 'Ajinderpal', last_name: 'Mangat', email: 'ajinderpal@bctigers.ca' },
  { first_name: 'Rakesh', last_name: 'Kumar', email: 'rakesh.kumar@bctigers.ca' },
  { first_name: 'Vicky', last_name: 'Virk', email: 'vicky.virk@bctigers.ca' },
  { first_name: 'David', last_name: 'Chen', email: 'david.chen@bctigers.ca' },
  { first_name: 'Maria', last_name: 'Santos', email: 'maria.santos@bctigers.ca' },
  { first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@bctigers.ca' },
  { first_name: 'James', last_name: 'Okonkwo', email: 'j.okonkwo@bctigers.ca' },
  { first_name: 'Sarah', last_name: 'MacDonald', email: 's.macdonald@bctigers.ca' },
];

const PALETTE = [
  { primary: '#F48735', accent: '#FEF3EB' },
  { primary: '#7C3AED', accent: '#F3E8FF' },
  { primary: '#0D9488', accent: '#CCFBF1' },
  { primary: '#DC2626', accent: '#FEE2E2' },
  { primary: '#2563EB', accent: '#DBEAFE' },
  { primary: '#CA8A04', accent: '#FEF9C3' },
  { primary: '#DB2777', accent: '#FCE7F3' },
  { primary: '#4F46E5', accent: '#E0E7FF' },
];

function inferCity(teamName: string): string {
  const n = teamName.toUpperCase();
  if (n.includes('WINNIPEG')) return 'Winnipeg, MB';
  if (n.includes('EDMONTON')) return 'Edmonton, AB';
  if (n.includes('CALGARY')) return 'Calgary, AB';
  if (n.includes('RICHMOND')) return 'Richmond, BC';
  if (n.includes('BRAMPTON')) return 'Brampton, ON';
  if (n.includes('FIJI')) return 'Surrey, BC';
  if (n.includes('BURUNDI')) return 'Surrey, BC';
  if (n.includes('VANCOUVER') || n.includes('VAN CITY')) return 'Vancouver, BC';
  if (n.includes('CLOVERDALE')) return 'Cloverdale, BC';
  if (n.includes('ABBOTSFORD')) return 'Abbotsford, BC';
  if (n.includes('DELTA')) return 'Delta, BC';
  return 'Surrey, BC';
}

function buildTeams(names: string[], colorOffset = 0) {
  return names.map((name, i) => {
    const colors = PALETTE[(colorOffset + i) % PALETTE.length];
    return { name, city: inferCity(name), primaryColor: colors.primary };
  });
}

const FIRST_NAMES_M = [
  'Harjot', 'Gurpreet', 'Jasleen', 'Aman', 'Navdeep', 'Karan', 'Ravi', 'Simran',
  'Arjun', 'Dev', 'Raj', 'Vikram', 'Manpreet', 'Kabir', 'Sukhman', 'Param',
  'Ekam', 'Taj', 'Noah', 'Liam', 'Milan', 'Sahil', 'Aarav', 'Krish',
  'Yuvraj', 'Jovan', 'Roshan', 'Ishaan', 'Ayaan', 'Tej', 'Rohan', 'Farhan',
  'Amar', 'Bilal', 'Carlos', 'Diego', 'Ethan', 'Felix', 'Gurshan', 'Harman',
];
const FIRST_NAMES_F = [
  'Simran', 'Priya', 'Ananya', 'Kiran', 'Meera', 'Sonia', 'Neha', 'Riya',
  'Aisha', 'Emma', 'Maya', 'Leila', 'Jiya', 'Diya', 'Amrita', 'Nisha',
  'Jasmeet', 'Navya', 'Isha', 'Avani', 'Saanvi', 'Zoya', 'Alina', 'Heer',
  'Mira', 'Tanya', 'Reet', 'Suhani', 'Anika', 'Guneet', 'Kavya', 'Rupinder',
];
const FIRST_NAMES_X = [
  'Alex', 'Jordan', 'Taylor', 'Avery', 'Rowan', 'Parker', 'Reese', 'Quinn',
  'Hayden', 'Skyler', 'Morgan', 'Casey', 'Dakota', 'Jules', 'Kendall', 'Riley',
  'Peyton', 'Emerson', 'Charlie', 'Phoenix', 'Micah', 'Blake', 'Cameron', 'Sage',
];
const LAST_NAMES = [
  'Singh', 'Kaur', 'Gill', 'Sandhu', 'Bains', 'Dhaliwal', 'Mangat', 'Virk',
  'Kumar', 'Sharma', 'Patel', 'Chen', 'Nguyen', 'Williams', 'Martinez', 'Johnson',
  'Toor', 'Sekhon', 'Sidhu', 'Dosanjh', 'Brar', 'Pannu', 'Chahal', 'Deol',
  'Grewal', 'Johal', 'Bhullar', 'Atwal', 'Sran', 'Basra', 'Randhawa', 'Aujla',
  'Dhillon', 'Boparai', 'Bassi', 'Khela', 'Saini', 'Dhindsa', 'Rai', 'Birdi',
  'Hundal', 'Sohal', 'Cheema', 'Garcha', 'Nijjar', 'Purewal', 'Sahota', 'Waraich',
];
const PLAYER_POSITIONS = ['GK', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'ST', 'CDM', 'CF', 'WB'] as const;
const PLAYER_NAME_CURSOR: Record<Gender, number> = { MALE: 0, FEMALE: 0, MIXED: 0 };

function slugifySeedName(first: string, last: string, teamSlug: string, index: number) {
  const base = `${first}-${last}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${teamSlug}-${index}`;
}

function firstNamesForGender(gender: Gender) {
  if (gender === 'FEMALE') return FIRST_NAMES_F;
  if (gender === 'MIXED') return FIRST_NAMES_X;
  return FIRST_NAMES_M;
}

function uniqueSeedName(gender: Gender, offset: number) {
  const firstNames = firstNamesForGender(gender);
  const comboCount = firstNames.length * LAST_NAMES.length;
  const idx = offset % comboCount;
  return {
    first_name: firstNames[idx % firstNames.length],
    last_name: LAST_NAMES[Math.floor(idx / firstNames.length) % LAST_NAMES.length],
  };
}

function playerDob(ageGroup: string, index: number): Date {
  const uMatch = ageGroup.match(/^U(\d+)$/);
  if (uMatch) {
    const birthYear = 2026 - parseInt(uMatch[1], 10) - (index % 2);
    return new Date(birthYear, (index * 3) % 12, 5 + (index % 20));
  }
  const year =
    ageGroup === '40+' ? 1978 - (index % 5)
    : ageGroup === '45+' ? 1973 - (index % 5)
    : 1995 - (index % 8);
  return new Date(year, (index * 3) % 12, 5 + (index % 20));
}

function playersPerTeamForDivision(div: MiriPiriDivisionSeed): number {
  if (div.slug.includes('recreational') || div.name.includes('Recreational')) return REC_PLAYERS_PER_TEAM;
  if (div.schedule_only && /^u[5-9]|^u1[0-2]/.test(div.slug)) return MINI_PLAYERS_PER_TEAM;
  if (div.age_group.startsWith('U')) return YOUTH_PLAYERS_PER_TEAM;
  return ADULT_PLAYERS_PER_TEAM;
}

function makePlayers(teamSlug: string, count: number, gender: Gender, ageGroup: string) {
  const start = PLAYER_NAME_CURSOR[gender];
  PLAYER_NAME_CURSOR[gender] += count;
  return Array.from({ length: count }, (_, i) => {
    const { first_name, last_name } = uniqueSeedName(gender, start + i);
    return {
      first_name,
      last_name,
      slug: slugifySeedName(first_name, last_name, teamSlug, i),
      jersey_number: i + 1,
      preferred_position: PLAYER_POSITIONS[i % PLAYER_POSITIONS.length],
      dob: playerDob(ageGroup, i),
    };
  });
}

type TeamRecord = { id: string; name: string; slug: string };
type PlayerRecord = { id: string; team_id: string; preferred_position: string | null };

interface FixturePlan {
  matchNum: string;
  homeName: string;
  awayName: string;
  day: number;
  hour: number;
  minute?: number;
  fieldName: string;
  matchType: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
}

async function ensurePointFormats() {
  const standardData = {
    name: 'Standard Soccer (3 Point System)',
    description: 'Traditional win 3 / draw 1 / loss 0 with no bonus points.',
    is_system: true,
    win: 3,
    draw: 1,
    loss: 0,
    bonuses_enabled: false,
    shutout_bonus: 0,
    goal_bonus_per_goal: 0,
    goal_bonus_cap: 0,
    apply_bonuses_on_loss: false,
    forfeit_win_score: 2,
    forfeit_loss_score: 0,
    forfeit_award_bonuses: false,
    tiebreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD', 'FAIR_PLAY', 'COIN_TOSS'],
  };
  const usfaData = {
    name: 'USFA 10-Point System',
    description:
      'Win 6 / draw 3 / loss 0, +1 shutout, +1 per goal (max 3). Forfeit 2-0. Max 10 pts per match.',
    is_system: true,
    win: 6,
    draw: 3,
    loss: 0,
    bonuses_enabled: true,
    shutout_bonus: 1,
    goal_bonus_per_goal: 1,
    goal_bonus_cap: 3,
    apply_bonuses_on_loss: true,
    forfeit_win_score: 2,
    forfeit_loss_score: 0,
    forfeit_award_bonuses: true,
    tiebreakers: ['HEAD_TO_HEAD', 'GOALS_AGAINST', 'GOALS_FOR', 'FAIR_PLAY', 'COIN_TOSS'],
  };

  const standard = await prisma.pointFormat.upsert({
    where: { slug: 'standard-soccer-3-point' },
    create: { id: 'pf-standard-soccer', slug: 'standard-soccer-3-point', ...standardData },
    update: standardData,
  });
  const usfa = await prisma.pointFormat.upsert({
    where: { slug: 'usfa-10-point' },
    create: { id: 'pf-usfa-10-point', slug: 'usfa-10-point', ...usfaData },
    update: usfaData,
  });
  return { standard, usfa };
}

async function recalculateStandings(divisionId: string) {
  const division = await prisma.division.findUniqueOrThrow({
    where: { id: divisionId },
    include: { point_format: true },
  });
  const [completedMatches, teams, cardEvents] = await Promise.all([
    prisma.match.findMany({
      where: { division_id: divisionId, status: 'COMPLETED' },
    }),
    prisma.team.findMany({ where: { division_id: divisionId }, select: { id: true } }),
    prisma.matchEvent.findMany({
      where: {
        type: { in: ['YELLOW_CARD', 'RED_CARD'] },
        match: { division_id: divisionId, status: 'COMPLETED' },
      },
      select: { team_id: true, type: true },
    }),
  ]);

  const teamIds = teams.map((t) => t.id);
  const fairPlay = buildFairPlayMap(cardEvents, teamIds);
  const results = completedMatches.map(mapPrismaMatchToResult);
  const config = toTournamentConfig(division.point_format);
  const rows = computeStandings(teamIds, results, config, fairPlay);

  for (const row of rows) {
    await prisma.standing.updateMany({
      where: { division_id: divisionId, team_id: row.teamId },
      data: {
        played: row.played,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goals_for: row.goalsFor,
        goals_against: row.goalsAgainst,
        goal_difference: row.goalDifference,
        points: row.points,
        fair_play: fairPlay.get(row.teamId) ?? 0,
        rank: row.rank,
      },
    });
  }
}

function teamByName(teams: TeamRecord[], name: string) {
  const team = teams.find((t) => t.name.toLowerCase() === name.toLowerCase());
  if (!team) throw new Error(`Team not found for fixture: ${name}`);
  return team;
}

function pickScorer(players: PlayerRecord[], teamId: string, preferForward = true) {
  const roster = players.filter((p) => p.team_id === teamId);
  const forwards = roster.filter((p) => p.preferred_position === 'ST' || p.preferred_position === 'CF');
  const pool = preferForward && forwards.length > 0 ? forwards : roster;
  return pool[Math.floor(Math.random() * pool.length)] ?? roster[0];
}

async function createGoalEvents(
  matchId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
  players: PlayerRecord[],
) {
  let minute = 8;
  for (let g = 0; g < homeScore; g++) {
    const scorer = pickScorer(players, homeTeamId);
    await prisma.matchEvent.create({
      data: {
        match_id: matchId,
        team_id: homeTeamId,
        player_id: scorer?.id,
        type: 'GOAL',
        minute: minute + g * 17,
      },
    });
  }
  minute = 14;
  for (let g = 0; g < awayScore; g++) {
    const scorer = pickScorer(players, awayTeamId);
    await prisma.matchEvent.create({
      data: {
        match_id: matchId,
        team_id: awayTeamId,
        player_id: scorer?.id,
        type: 'GOAL',
        minute: minute + g * 19,
      },
    });
  }
}

function fixturesFromDivision(div: MiriPiriDivisionSeed): FixturePlan[] {
  return div.matches.map((m) => ({
    matchNum: m.num,
    homeName: m.home,
    awayName: m.away,
    day: m.day,
    hour: m.hour,
    minute: m.minute,
    fieldName: m.field,
    matchType: m.matchType,
    status: m.status,
    homeScore: 0,
    awayScore: 0,
  }));
}

async function seedPlannedMatches(
  tournamentId: string,
  divisionId: string,
  teams: TeamRecord[],
  players: PlayerRecord[],
  venueIdByKey: Map<VenueKey, string>,
  fieldByName: Map<string, string>,
  fixtures: FixturePlan[],
) {
  const napVenueId = venueIdByKey.get('nap')!;
  for (let i = 0; i < fixtures.length; i++) {
    const fx = fixtures[i];
    // Bracket/pool placeholders ("Winner of Match 11", "Pool A 1st") are stored
    // as display labels, not teams — so no placeholder Team rows are created.
    const home = isPlaceholderTeam(fx.homeName) ? null : teamByName(teams, fx.homeName);
    const away = isPlaceholderTeam(fx.awayName) ? null : teamByName(teams, fx.awayName);
    const official = REFEREES[i % REFEREES.length];
    const fieldId = fieldByName.get(fx.fieldName) ?? fieldByName.values().next().value;
    // Venue follows the field's park (NAP → Newton, else its own venue).
    const venueId = venueIdByKey.get(venueKeyForField(fx.fieldName)) ?? napVenueId;

    const match = await prisma.match.create({
      data: {
        tournament_id: tournamentId,
        division_id: divisionId,
        home_team_id: home?.id ?? null,
        away_team_id: away?.id ?? null,
        home_label: home ? null : fx.homeName,
        away_label: away ? null : fx.awayName,
        venue_id: venueId,
        field_id: fieldId,
        scheduled_start: cupDate(fx.day, fx.hour, fx.minute ?? 0),
        scheduled_end: cupDate(fx.day, fx.hour + 1, 45),
        status: fx.status,
        round: parseInt(fx.matchNum.replace(/\D/g, ''), 10) || i + 1,
        match_type: fx.matchType,
        home_score: fx.homeScore,
        away_score: fx.awayScore,
      },
    });

    await prisma.matchOfficial.createMany({
      data: [
        {
          match_id: match.id,
          name: `${official.first_name} ${official.last_name}`,
          role: 'MAIN',
          email: official.email,
        },
        {
          match_id: match.id,
          name: `${REFEREES[(i + 1) % REFEREES.length].first_name} ${REFEREES[(i + 1) % REFEREES.length].last_name}`,
          role: 'AR1',
        },
      ],
    });

    if ((fx.status === 'COMPLETED' || fx.status === 'LIVE') && home && away) {
      await createGoalEvents(match.id, home.id, away.id, fx.homeScore, fx.awayScore, players);
    }
  }
}

// Admin credentials are NOT hardcoded — they must be supplied via environment
// variables. The seed refuses to run without them, so no account email or
// password ever ships in source control.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const SUPERADMIN_EMAIL = process.env.SEED_SUPERADMIN_EMAIL;
const SUPERADMIN_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD;

async function main() {
  // This seed is destructive — it wipes every table before inserting demo data.
  // Guard against accidentally running it against a production database.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error(
      'Refusing to run destructive seed with NODE_ENV=production. ' +
        'Set ALLOW_PROD_SEED=true to override (this DELETES all data).',
    );
  }
  // Require admin credentials from the environment — none are baked into source.
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
    throw new Error(
      'Missing seed admin credentials. Set SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, ' +
        'SEED_SUPERADMIN_EMAIL, and SEED_SUPERADMIN_PASSWORD before running the seed.',
    );
  }

  console.log('Seeding Miri Piri 2026 tournament data...');
  assertValidMiriPiri2026Data();

  await prisma.passwordResetToken.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.bracketNode.deleteMany();
  await prisma.standing.deleteMany();
  await prisma.matchOfficial.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.match.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.division.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.field.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();
  console.log('  Cleared existing data.');

  // The whole Miri Piri tournament runs on the 10-point system, so every
  // division uses it. (The 3-point standard format is still created so it's
  // available to pick in the admin point-formats list.)
  const { usfa: usfaFormat } = await ensurePointFormats();
  console.log('  Point formats ready.');

  const adminUser = await prisma.user.create({
    data: {
      first_name: 'BC Tigers',
      last_name: 'Admin',
      email: ADMIN_EMAIL,
      password_hash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: 'ADMIN',
      approved: true,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      first_name: 'BC Tigers',
      last_name: 'Super Admin',
      email: SUPERADMIN_EMAIL,
      password_hash: await bcrypt.hash(SUPERADMIN_PASSWORD, 12),
      role: 'SUPERADMIN',
      approved: true,
      active: true,
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      site_name: 'BC Tigers FC',
      contact_email: 'bctigersfc@gmail.com',
      contact_phone:
        'Ajinderpal Mangat (604) 240-9742 · Youth: Rakesh Kumar (778) 233-7338 · Adult: Vicky Virk (604) 760-3506',
      contact_address: 'Newton Athletic Park, 7395 128 St, Surrey, BC V3W 2M7 · www.bctigers.com',
      timezone: 'America/Vancouver',
    },
    update: {
      site_name: 'BC Tigers FC',
      contact_email: 'bctigersfc@gmail.com',
      contact_phone:
        'Ajinderpal Mangat (604) 240-9742 · Youth: Rakesh Kumar (778) 233-7338 · Adult: Vicky Virk (604) 760-3506',
      contact_address: 'Newton Athletic Park, 7395 128 St, Surrey, BC V3W 2M7 · www.bctigers.com',
      timezone: 'America/Vancouver',
    },
  });

  const venueIdByKey = new Map<VenueKey, string>();
  for (const v of VENUES) {
    const created = await prisma.venue.create({
      data: {
        name: v.name,
        slug: v.slug,
        address: v.address,
        city: v.city,
        parking_info: v.parking_info,
      },
    });
    venueIdByKey.set(v.key, created.id);
  }
  const napVenueId = venueIdByKey.get('nap')!;

  const fields = await Promise.all(
    FIELDS.map((f) =>
      prisma.field.create({
        data: {
          venue_id: venueIdByKey.get(f.venueKey) ?? napVenueId,
          name: f.name,
          surface: f.surface,
          capacity: 500,
        },
      }),
    ),
  );
  const fieldByName = new Map(fields.map((f) => [f.name, f.id]));

  console.log(`  ${VENUES.length} venues, ${fields.length} fields.`);

  const tournament = await prisma.tournament.create({
    data: {
      name: '14th Annual Miri Piri Soccer Tournament',
      slug: 'miri-piri-2026',
      description:
        'Miri Piri Canada Soccer Cup — hosted by BC Tigers FC in association with BC Soccer. ' +
        '$70,000 total sponsored prize pool across adult, youth, recreational, and masters divisions. ' +
        'District team entry deadline June 15, 2026. Free lunch Saturday & Sunday, free parking on site.',
      start_date: cupDate(3, 18),
      end_date: cupDate(5, 20),
      location: 'Newton Athletic Park, Surrey, BC',
      status: 'ACTIVE',
      tournament_type: 'GROUP_STAGE_PLUS_KNOCKOUT',
      rules: TOURNAMENT_RULES,
      created_by: adminUser.id,
    },
  });
  console.log(`  Tournament: ${tournament.name} (${tournament.status})`);

  let divisionIndex = 0;
  let totalTeams = 0;
  let totalPlayers = 0;
  let matchDivisions = 0;

  for (const divConfig of MIRI_PIRI_2026_DIVISIONS) {
    const teamDefs = buildTeams(divConfig.teams, divisionIndex * 3);
    const colors = PALETTE[divisionIndex % PALETTE.length];
    const playersPerTeam = playersPerTeamForDivision(divConfig);

    const division = await prisma.division.create({
      data: {
        tournament_id: tournament.id,
        name: divConfig.name,
        slug: divConfig.slug,
        age_group: divConfig.age_group,
        gender: divConfig.gender,
        max_teams: Math.max(16, teamDefs.length),
        format: `${divConfig.format} · ${divConfig.prize_note}`,
        point_format_id: usfaFormat.id,
        primary_color: colors.primary,
        accent_color: colors.accent,
        schedule_only: divConfig.schedule_only,
      },
    });

    const teams = await Promise.all(
      teamDefs.map((t) =>
        prisma.team.create({
          data: {
            division_id: division.id,
            name: t.name,
            slug: slugify(`${divConfig.slug}-${t.name}`),
            logo: teamLogoUrl(t.name, t.primaryColor),
            city: t.city,
            founded_year: 2010 + (divisionIndex % 12),
            primary_color: t.primaryColor,
            created_by: adminUser.id,
          },
        }),
      ),
    );
    totalTeams += teams.length;

    const allPlayers: PlayerRecord[] = [];
    for (const team of teams) {
      const playerDefs = makePlayers(team.slug, playersPerTeam, divConfig.gender, divConfig.age_group);
      await prisma.player.createMany({
        data: playerDefs.map((p) => ({ ...p, team_id: team.id, active: true })),
      });
      const created = await prisma.player.findMany({
        where: { team_id: team.id },
        select: { id: true, team_id: true, preferred_position: true },
      });
      allPlayers.push(...created);
      totalPlayers += playerDefs.length;
    }

    await Promise.all(
      teams.map((t) =>
        prisma.standing.create({
          data: { division_id: division.id, team_id: t.id, rank: 0 },
        }),
      ),
    );

    if (divConfig.seedMatches) {
      const teamRecords: TeamRecord[] = teams.map((t) => ({ id: t.id, name: t.name, slug: t.slug }));
      const fixtures = fixturesFromDivision(divConfig);

      await seedPlannedMatches(
        tournament.id,
        division.id,
        teamRecords,
        allPlayers,
        venueIdByKey,
        fieldByName,
        fixtures,
      );
      if (!divConfig.schedule_only) {
        await recalculateStandings(division.id);
      }
      matchDivisions++;
    }

    divisionIndex++;
  }

  const totalMatches = MIRI_PIRI_2026_DIVISIONS.reduce((n, d) => n + d.matches.length, 0);
  console.log(`  ${MIRI_PIRI_2026_DIVISIONS.length} divisions, ${totalTeams} teams, ${totalPlayers} players, ${totalMatches} matches.`);
  console.log(`  Schedules seeded in ${matchDivisions} divisions.`);

  await prisma.announcement.createMany({
    data: [
      {
        tournament_id: tournament.id,
        title: 'Welcome to the 14th Annual Miri Piri Soccer Tournament',
        message:
          'July 3–5, 2026 at Newton Athletic Park, Surrey. Check-in opens 90 minutes before your first match. ' +
          'District team entry deadline was June 15, 2026.',
        type: 'INFO',
      },
      {
        tournament_id: tournament.id,
        title: 'Saturday & Sunday lunch provided',
        message:
          'Free appetizers and lunch for all registered teams on Saturday and Sunday. ' +
          'Head to the BC Tigers FC hospitality tent near Field 1.',
        type: 'INFO',
      },
      {
        tournament_id: tournament.id,
        title: 'Parking & field assignments',
        message:
          'Free parking on site via 128 Street. Additional parking across the street at FD Sinclair School. ' +
          'Check NAP field assignments on your schedule — mini divisions use NAP Mini Turf 1 and NAP 3A–6.',
        type: 'INFO',
      },
      {
        tournament_id: tournament.id,
        title: 'Schedules from official grid',
        message:
          'All division schedules are seeded from the official Miri Piri 2026 tournament grids. ' +
          'Please check your schedule 24 hours before each game to confirm any changes.',
        type: 'INFO',
      },
    ],
  });

  console.log('\nSeed complete.');
  console.log('  Hub: /tournaments/miri-piri-2026');
  // Don't print credentials — sign in with the SEED_*_EMAIL / SEED_*_PASSWORD
  // values you provided in the environment.
  console.log('  Admin + Super Admin created from SEED_* environment variables.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
