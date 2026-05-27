import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL!;
const isRemote =
  !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');
const adapter = new PrismaPg({
  connectionString,
  ...(isRemote && { ssl: { rejectUnauthorized: false } }),
});
const prisma = new PrismaClient({ adapter });

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
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

/** Miri Piri 2026 — July 3–5 (local Pacific) */
function cupDate(day: number, hour = 10, minute = 0) {
  return new Date(2026, 6, day, hour, minute, 0);
}

function roundRobin(teamIds: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < teamIds.length - 1; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairs.push([teamIds[i], teamIds[j]]);
    }
  }
  return pairs;
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

const VENUE = {
  name: 'Newton Athletic Park',
  slug: 'newton-athletic-park',
  address: '7395 128 St',
  city: 'Surrey, BC V3W 2M7',
  parking_info: 'Free parking available on site.',
};

const FIELDS = ['Field 1', 'Field 2', 'Field 3', 'Field 4'];

const REFEREES = [
  { first_name: 'Ajinderpal', last_name: 'Mangat', email: 'ajinderpal@bctigers.ca', certification: 'Provincial' },
  { first_name: 'Rakesh', last_name: 'Kumar', email: 'rakesh.kumar@bctigers.ca', certification: 'Youth Coordinator' },
  { first_name: 'Vicky', last_name: 'Virk', email: 'vicky.virk@bctigers.ca', certification: 'Adult Coordinator' },
  { first_name: 'David', last_name: 'Chen', email: 'david.chen@bctigers.ca', certification: 'National A' },
  { first_name: 'Maria', last_name: 'Santos', email: 'maria.santos@bctigers.ca', certification: 'National A' },
  { first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@bctigers.ca', certification: 'Regional B' },
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

type Gender = 'MALE' | 'FEMALE' | 'MIXED';

interface DivisionSeed {
  name: string;
  slug: string;
  age_group: string;
  gender: Gender;
  format: string;
  prize_note: string;
  teams: { name: string; city: string; primaryColor: string }[];
  seedMatches?: boolean;
}

function teamsFor(prefix: string, city = 'Surrey') {
  return [
    { name: `${prefix} Tigers`, city, primaryColor: '#F48735' },
    { name: `${prefix} Khalsa FC`, city, primaryColor: '#1B1B1B' },
    { name: `${prefix} United`, city: 'Vancouver', primaryColor: '#002D72' },
    { name: `${prefix} Warriors`, city: 'Delta', primaryColor: '#006600' },
  ];
}

const DIVISIONS: DivisionSeed[] = [
  {
    name: "Men's Premier Division",
    slug: 'mens-premier',
    age_group: 'Adult',
    gender: 'MALE',
    format: '11-a-side · Round Robin + Knockout',
    prize_note: '1st $15,000 · 2nd $7,000 + trophies & medals',
    teams: teamsFor('Premier'),
    seedMatches: true,
  },
  {
    name: "Women's Premier Division",
    slug: 'womens-premier',
    age_group: 'Adult',
    gender: 'FEMALE',
    format: '11-a-side · Round Robin + Knockout',
    prize_note: '1st $15,000 · 2nd $7,000 + trophies & medals',
    teams: teamsFor('Premier', 'Burnaby'),
    seedMatches: true,
  },
  {
    name: "Men's Gold Division 1",
    slug: 'mens-gold-1',
    age_group: 'Adult',
    gender: 'MALE',
    format: '11-a-side · Round Robin + Knockout',
    prize_note: '1st $5,000 · 2nd $3,000 + trophies & medals',
    teams: teamsFor('Gold'),
    seedMatches: true,
  },
  {
    name: "Women's Gold Division 1",
    slug: 'womens-gold-1',
    age_group: 'Adult',
    gender: 'FEMALE',
    format: '11-a-side · Round Robin + Knockout',
    prize_note: '1st $5,000 · 2nd $3,000 + trophies & medals',
    teams: teamsFor('Gold', 'Richmond'),
  },
  {
    name: "Men's Silver Division 2",
    slug: 'mens-silver-2',
    age_group: 'Adult',
    gender: 'MALE',
    format: '11-a-side',
    prize_note: '1st $2,000 · 2nd $1,000 + trophies & medals',
    teams: teamsFor('Silver'),
  },
  {
    name: "Women's Silver Division 2",
    slug: 'womens-silver-2',
    age_group: 'Adult',
    gender: 'FEMALE',
    format: '11-a-side',
    prize_note: '1st $2,000 · 2nd $1,000 + trophies & medals',
    teams: teamsFor('Silver', 'Langley'),
  },
  {
    name: "Men's Bronze Division 3",
    slug: 'mens-bronze-3',
    age_group: 'Adult',
    gender: 'MALE',
    format: '11-a-side',
    prize_note: '1st $750 · 2nd $400 + trophies & medals',
    teams: teamsFor('Bronze'),
  },
  {
    name: "Women's Bronze Division 3",
    slug: 'womens-bronze-3',
    age_group: 'Adult',
    gender: 'FEMALE',
    format: '11-a-side',
    prize_note: '1st $750 · 2nd $400 + trophies & medals',
    teams: teamsFor('Bronze', 'Abbotsford'),
  },
  {
    name: "Men's Recreational Division",
    slug: 'mens-recreational',
    age_group: 'Adult',
    gender: 'MALE',
    format: '6-a-side recreational',
    prize_note: 'Medals — winners & finalists',
    teams: teamsFor('Rec Men'),
  },
  {
    name: "Women's Recreational Division",
    slug: 'womens-recreational',
    age_group: 'Adult',
    gender: 'FEMALE',
    format: '6-a-side recreational',
    prize_note: 'Medals — winners & finalists',
    teams: teamsFor('Rec Women', 'Burnaby'),
  },
  {
    name: 'Co-Ed 6-a-side',
    slug: 'coed-6aside',
    age_group: 'Adult',
    gender: 'MIXED',
    format: '6-a-side co-ed',
    prize_note: 'Medals — winners & finalists',
    teams: teamsFor('Co-Ed'),
  },
  {
    name: "Men's Over 35",
    slug: 'mens-over-35',
    age_group: '35+',
    gender: 'MALE',
    format: '11-a-side masters',
    prize_note: 'Trophy & medals — winners & finalists',
    teams: teamsFor('Masters 35'),
  },
  {
    name: "Women's Over 35",
    slug: 'womens-over-35',
    age_group: '35+',
    gender: 'FEMALE',
    format: '11-a-side masters',
    prize_note: 'Trophy & medals — winners & finalists',
    teams: teamsFor('Masters 35', 'Burnaby'),
  },
  {
    name: "Over 40 Men's",
    slug: 'mens-over-40',
    age_group: '40+',
    gender: 'MALE',
    format: '8-a-side',
    prize_note: 'Trophy & medals — winners & finalists',
    teams: teamsFor('Masters 40'),
  },
  {
    name: "Over 50 Men's",
    slug: 'mens-over-50',
    age_group: '50+',
    gender: 'MALE',
    format: '8-a-side',
    prize_note: 'Trophy & medals — winners & finalists',
    teams: teamsFor('Masters 50'),
  },
  {
    name: "Men's U19 Division",
    slug: 'mens-u19',
    age_group: 'U19',
    gender: 'MALE',
    format: '11-a-side · Min. 3 games',
    prize_note: '1st $500 · 2nd $300 + trophies & medals',
    teams: teamsFor('U19'),
    seedMatches: true,
  },
  {
    name: "Women's U19 Division",
    slug: 'womens-u19',
    age_group: 'U19',
    gender: 'FEMALE',
    format: '11-a-side · Min. 3 games',
    prize_note: '1st $500 · 2nd $300 + trophies & medals',
    teams: teamsFor('U19', 'North Vancouver'),
  },
  {
    name: 'Boys U13–U18',
    slug: 'boys-u13-u18',
    age_group: 'U13-U18',
    gender: 'MALE',
    format: '11-a-side · Min. 3 games',
    prize_note: 'Participation medals for all',
    teams: teamsFor('Boys Academy'),
  },
  {
    name: 'Girls U13–U18',
    slug: 'girls-u13-u18',
    age_group: 'U13-U18',
    gender: 'FEMALE',
    format: '11-a-side · Min. 3 games',
    prize_note: 'Participation medals for all',
    teams: teamsFor('Girls Academy', 'Surrey'),
  },
  {
    name: 'Boys U6–U12',
    slug: 'boys-u6-u12',
    age_group: 'U6-U12',
    gender: 'MALE',
    format: 'Youth · Min. 3 games',
    prize_note: 'Participation medals for all',
    teams: teamsFor('Junior Boys'),
  },
  {
    name: 'Girls U6–U12',
    slug: 'girls-u6-u12',
    age_group: 'U6-U12',
    gender: 'FEMALE',
    format: 'Youth · Min. 3 games',
    prize_note: 'Participation medals for all',
    teams: teamsFor('Junior Girls'),
  },
];

const FIRST_NAMES_M = [
  'Harjot', 'Gurpreet', 'Jasleen', 'Aman', 'Navdeep', 'Karan', 'Ravi', 'Simran',
  'Arjun', 'Dev', 'Raj', 'Vikram', 'Manpreet', 'Kabir', 'Sukhman', 'Param',
  'Ekam', 'Taj', 'Noah', 'Liam', 'Milan', 'Sahil', 'Aarav', 'Krish',
  'Yuvraj', 'Jovan', 'Roshan', 'Ishaan', 'Ayaan', 'Tej', 'Rohan', 'Farhan',
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
];
const PLAYER_POSITIONS = ['GK', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'ST'] as const;
const PLAYER_NAME_CURSOR: Record<Gender, number> = {
  MALE: 0,
  FEMALE: 0,
  MIXED: 0,
};

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
  const totalCombos = firstNames.length * LAST_NAMES.length;

  if (offset >= totalCombos) {
    throw new Error(`Not enough unique seeded player names for ${gender.toLowerCase()} rosters.`);
  }

  return {
    first_name: firstNames[offset % firstNames.length],
    last_name: LAST_NAMES[Math.floor(offset / firstNames.length)],
  };
}

function makePlayers(teamSlug: string, count: number, gender: Gender) {
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
      nationality: 'Canadian',
    };
  });
}

async function recalculateStandings(divisionId: string) {
  const division = await prisma.division.findUniqueOrThrow({ where: { id: divisionId } });
  const completedMatches = await prisma.match.findMany({
    where: { division_id: divisionId, status: 'COMPLETED' },
  });

  const statsMap = new Map<
    string,
    {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goals_for: number;
      goals_against: number;
      points: number;
      fair_play: number;
    }
  >();
  const init = () => ({
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    points: 0,
    fair_play: 0,
  });

  for (const m of completedMatches) {
    if (!statsMap.has(m.home_team_id)) statsMap.set(m.home_team_id, init());
    if (!statsMap.has(m.away_team_id)) statsMap.set(m.away_team_id, init());
    const home = statsMap.get(m.home_team_id)!;
    const away = statsMap.get(m.away_team_id)!;
    home.played++;
    away.played++;
    home.goals_for += m.home_score;
    home.goals_against += m.away_score;
    away.goals_for += m.away_score;
    away.goals_against += m.home_score;
    if (m.home_score > m.away_score) {
      home.wins++;
      home.points += division.points_win;
      away.losses++;
      away.points += division.points_loss;
    } else if (m.home_score < m.away_score) {
      away.wins++;
      away.points += division.points_win;
      home.losses++;
      home.points += division.points_loss;
    } else {
      home.draws++;
      away.draws++;
      home.points += division.points_draw;
      away.points += division.points_draw;
    }
  }

  const sorted = Array.from(statsMap.entries()).sort(
    ([, a], [, b]) =>
      b.points - a.points ||
      b.goals_for - b.goals_against - (a.goals_for - a.goals_against) ||
      b.goals_for - a.goals_for ||
      b.fair_play - a.fair_play,
  );

  for (const [team_id, stats] of sorted) {
    await prisma.standing.updateMany({
      where: { division_id: divisionId, team_id },
      data: {
        ...stats,
        goal_difference: stats.goals_for - stats.goals_against,
        rank: sorted.findIndex(([id]) => id === team_id) + 1,
      },
    });
  }
}

async function seedDivisionMatches(
  tournamentId: string,
  divisionId: string,
  teamIds: string[],
  venueId: string,
  refereeIds: string[],
  fieldIds: string[],
) {
  const fixtures = roundRobin(teamIds);
  const results = [
    { homeScore: 2, awayScore: 1 },
    { homeScore: 0, awayScore: 0 },
    { homeScore: 3, awayScore: 2 },
    { homeScore: 1, awayScore: 1 },
    { homeScore: 2, awayScore: 0 },
    { homeScore: 4, awayScore: 3 },
  ];

  const scheduleDays = [3, 4, 4, 5, 5, 5];

  for (let i = 0; i < fixtures.length; i++) {
    const [homeId, awayId] = fixtures[i];
    const isCompleted = i < 4;
    const isLive = i === 4;
    const day = scheduleDays[i] ?? 5;
    const hour = 9 + (i % 4) * 2;
    const result = isCompleted ? results[i] : null;

    const match = await prisma.match.create({
      data: {
        tournament_id: tournamentId,
        division_id: divisionId,
        home_team_id: homeId,
        away_team_id: awayId,
        venue_id: venueId,
        field_id: fieldIds[i % fieldIds.length],
        scheduled_start: cupDate(day, hour),
        status: isCompleted ? 'COMPLETED' : isLive ? 'LIVE' : 'SCHEDULED',
        round: Math.floor(i / 2) + 1,
        home_score: result?.homeScore ?? (isLive ? 1 : 0),
        away_score: result?.awayScore ?? 0,
      },
    });

    await prisma.matchReferee.create({
      data: {
        match_id: match.id,
        referee_id: refereeIds[i % refereeIds.length],
        role: 'MAIN',
      },
    });

    if (isCompleted && result) {
      for (let g = 0; g < result.homeScore; g++) {
        await prisma.matchEvent.create({
          data: { match_id: match.id, team_id: homeId, type: 'GOAL', minute: 12 + g * 15 },
        });
      }
      for (let g = 0; g < result.awayScore; g++) {
        await prisma.matchEvent.create({
          data: { match_id: match.id, team_id: awayId, type: 'GOAL', minute: 20 + g * 18 },
        });
      }
    }
  }
}

async function main() {
  console.log('Seeding Miri Piri 2026 tournament data...');

  await prisma.passwordResetToken.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.media.deleteMany();
  await prisma.playerStat.deleteMany();
  await prisma.bracketNode.deleteMany();
  await prisma.standing.deleteMany();
  await prisma.matchReferee.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.match.deleteMany();
  await prisma.teamRoster.deleteMany();
  await prisma.teamCoach.deleteMany();
  await prisma.coach.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.division.deleteMany();
  await prisma.tournamentAdmin.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.referee.deleteMany();
  await prisma.field.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();
  console.log('  Cleared existing data.');

  const adminUser = await prisma.user.create({
    data: {
      first_name: 'BC Tigers',
      last_name: 'Admin',
      email: 'admin@bctigers.ca',
      password_hash: await bcrypt.hash('Admin1234!', 12),
      role: 'ADMIN',
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
      contact_address:
        'Newton Athletic Park, 7395 128 St, Surrey, BC V3W 2M7 · www.bctigers.com',
      max_teams_per_division: 16,
      registration_open: true,
    },
    update: {
      site_name: 'BC Tigers FC',
      contact_email: 'bctigersfc@gmail.com',
      contact_phone:
        'Ajinderpal Mangat (604) 240-9742 · Youth: Rakesh Kumar (778) 233-7338 · Adult: Vicky Virk (604) 760-3506',
      contact_address:
        'Newton Athletic Park, 7395 128 St, Surrey, BC V3W 2M7 · www.bctigers.com',
      max_teams_per_division: 16,
      registration_open: true,
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      first_name: 'Demo',
      last_name: 'Viewer',
      email: 'viewer@bctigers.ca',
      password_hash: await bcrypt.hash('demo1234', 12),
      role: 'VIEWER',
    },
  });

  const venue = await prisma.venue.create({ data: VENUE });
  const fields = await Promise.all(
    FIELDS.map((name) => prisma.field.create({ data: { venue_id: venue.id, name, surface: 'Grass' } })),
  );
  const referees = await Promise.all(REFEREES.map((r) => prisma.referee.create({ data: r })));
  const refereeIds = referees.map((r) => r.id);
  const fieldIds = fields.map((f) => f.id);

  console.log(`  Venue: ${venue.name} (${fields.length} fields)`);
  console.log(`  Referees: ${referees.length}`);

  const tournament = await prisma.tournament.create({
    data: {
      name: '14th Annual Miri Piri Soccer Tournament',
      slug: 'miri-piri-2026',
      description:
        'Miri Piri Canada Soccer Cup — hosted by BC Tigers FC in association with BC Soccer. ' +
        '$70,000 total sponsored prize pool. Youth U6–U19, adult, recreational, and masters divisions. ' +
        'District team entry deadline June 15, 2026. ' +
        'Free lunch Saturday & Sunday, free parking, refreshments on site.',
      start_date: cupDate(3, 18),
      end_date: cupDate(5, 20),
      location: 'Newton Athletic Park, Surrey, BC',
      status: 'UPCOMING',
      tournament_type: 'GROUP_STAGE_PLUS_KNOCKOUT',
      rules: TOURNAMENT_RULES,
      created_by: adminUser.id,
    },
  });
  console.log(`  Tournament: ${tournament.name}`);

  let divisionIndex = 0;
  let totalTeams = 0;
  let totalPlayers = 0;
  let matchDivisions = 0;

  for (const divConfig of DIVISIONS) {
    const colors = PALETTE[divisionIndex % PALETTE.length];
    const division = await prisma.division.create({
      data: {
        tournament_id: tournament.id,
        name: divConfig.name,
        slug: divConfig.slug,
        age_group: divConfig.age_group,
        gender: divConfig.gender,
        max_teams: 16,
        format: `${divConfig.format} · ${divConfig.prize_note}`,
        points_win: 3,
        points_draw: 1,
        points_loss: 0,
        primary_color: colors.primary,
        accent_color: colors.accent,
      },
    });

    const teams = await Promise.all(
      divConfig.teams.map((t) =>
        prisma.team.create({
          data: {
            division_id: division.id,
            name: t.name,
            slug: slugify(`${divConfig.slug}-${t.name}`),
            logo: teamLogoUrl(t.name, t.primaryColor),
            city: t.city,
            primary_color: t.primaryColor,
            created_by: adminUser.id,
          },
        }),
      ),
    );
    totalTeams += teams.length;

    for (const team of teams) {
      const playerDefs = makePlayers(team.slug, 12, divConfig.gender);
      const players = await prisma.player.createManyAndReturn({ data: playerDefs });
      await prisma.teamRoster.createMany({
        data: players.map((player) => ({
          team_id: team.id,
          player_id: player.id,
          season: '2026',
          active: true,
        })),
      });
      totalPlayers += players.length;
    }

    await Promise.all(
      teams.map((t) =>
        prisma.standing.create({
          data: { division_id: division.id, team_id: t.id, rank: 0 },
        }),
      ),
    );

    if (divConfig.seedMatches) {
      await seedDivisionMatches(
        tournament.id,
        division.id,
        teams.map((t) => t.id),
        venue.id,
        refereeIds,
        fieldIds,
      );
      await recalculateStandings(division.id);
      matchDivisions++;
    }

    divisionIndex++;
  }

  console.log(`  ${DIVISIONS.length} divisions, ${totalTeams} teams, ${totalPlayers} players.`);
  console.log(`  Sample schedules in ${matchDivisions} featured divisions.`);

  const firstTeam = await prisma.team.findFirst({ include: { division: true } });
  const firstPlayer = await prisma.player.findFirst();
  const firstReferee = await prisma.referee.findFirst();

  const coachUser = await prisma.user.create({
    data: {
      first_name: 'Vicky',
      last_name: 'Virk',
      email: 'coach@bctigers.ca',
      password_hash: await bcrypt.hash('demo1234', 12),
      role: 'COACH',
    },
  });

  const coach = await prisma.coach.create({
    data: {
      first_name: 'Vicky',
      last_name: 'Virk',
      email: 'vicky.virk@bctigers.ca',
      user_id: coachUser.id,
    },
  });

  if (firstTeam) {
    await prisma.teamCoach.create({
      data: { team_id: firstTeam.id, coach_id: coach.id, role: 'Head Coach' },
    });
  }

  const refereeUser = await prisma.user.create({
    data: {
      first_name: firstReferee?.first_name ?? 'David',
      last_name: firstReferee?.last_name ?? 'Chen',
      email: 'referee@bctigers.ca',
      password_hash: await bcrypt.hash('demo1234', 12),
      role: 'REFEREE',
    },
  });

  if (firstReferee) {
    await prisma.referee.update({
      where: { id: firstReferee.id },
      data: { user_id: refereeUser.id },
    });
  }

  const playerUser = await prisma.user.create({
    data: {
      first_name: firstPlayer?.first_name ?? 'Harjot',
      last_name: firstPlayer?.last_name ?? 'Singh',
      email: 'player@bctigers.ca',
      password_hash: await bcrypt.hash('demo1234', 12),
      role: 'PLAYER',
    },
  });

  if (firstPlayer) {
    await prisma.player.update({
      where: { id: firstPlayer.id },
      data: { user_id: playerUser.id },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        user_id: null,
        tournament_id: tournament.id,
        title: '14th Annual Miri Piri Soccer Tournament',
        message:
          'July 3–5, 2026 at Newton Athletic Park, Surrey. $70,000 sponsored prize pool. ' +
          'District team entry deadline June 15, 2026. Early bird May 15; final registration June 15, 2026.',
        type: 'INFO',
      },
      {
        user_id: null,
        tournament_id: tournament.id,
        title: 'Weekend perks for all teams',
        message:
          'Free appetizers and lunch Saturday & Sunday. Free parking on site. Refreshments available.',
        type: 'INFO',
      },
      {
        user_id: null,
        tournament_id: tournament.id,
        title: 'Division rules',
        message:
          'Maximum 16 teams per division. Youth U6–U19: minimum 3 games guaranteed. ' +
          'U13–U18: participation medals for all players. Recreational & masters divisions available.',
        type: 'INFO',
      },
      {
        user_id: adminUser.id,
        tournament_id: tournament.id,
        title: 'Admin: registration tracking',
        message: 'Early bird deadline May 15, 2026. Final registration June 15, 2026.',
        type: 'INFO',
      },
      {
        user_id: viewerUser.id,
        tournament_id: tournament.id,
        title: 'Tournament weekend July 3–5',
        message: 'Friday evening kickoff July 3. Contact bctigersfc@gmail.com for details.',
        type: 'INFO',
      },
    ],
  });

  await prisma.media.createMany({
    data: [
      {
        tournament_id: tournament.id,
        type: 'PHOTO',
        url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
        title: 'Miri Piri Canada Soccer Cup 2026',
        description: 'Hosted by BC Tigers FC · Newton Athletic Park',
      },
      {
        tournament_id: tournament.id,
        type: 'PHOTO',
        url: 'https://images.unsplash.com/photo-1522778119026-d949f05cc960?w=800&q=80',
        title: 'Tournament weekend',
        description: 'July 3–5, 2026 · Surrey, BC',
      },
    ],
  });

  console.log('\nSeed complete.');
  console.log('  Tournament: /tournaments/miri-piri-2026');
  console.log('  Admin: admin@bctigers.ca / Admin1234!');
  console.log('  Portal: coach@, referee@, player@, viewer@bctigers.ca / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
