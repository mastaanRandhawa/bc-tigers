import 'dotenv/config';
import { PrismaClient, type Gender, type MatchStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

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

const SEED_MAX_TEAMS_PER_DIVISION = Number(process.env.SEED_MAX_TEAMS_PER_DIVISION ?? 8);
const ADULT_PLAYERS_PER_TEAM = 15;
const YOUTH_PLAYERS_PER_TEAM = 12;
const REC_PLAYERS_PER_TEAM = 10;

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
  parking_info: 'Free parking available on site. Enter from 128 Street.',
};

const FIELDS = [
  { name: 'Field 1', surface: 'Natural grass' },
  { name: 'Field 2', surface: 'Natural grass' },
  { name: 'Field 3', surface: 'Turf' },
  { name: 'Field 4', surface: 'Turf' },
];

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

interface DivisionSeed {
  name: string;
  slug: string;
  age_group: string;
  gender: Gender;
  format: string;
  prize_note: string;
  teams: string[];
  seedMatches?: boolean;
  playersPerTeam?: number;
}

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

const DIVISIONS: DivisionSeed[] = [
  {
    name: 'Premier',
    slug: 'premier',
    age_group: 'Adult',
    gender: 'MALE',
    format: '11-a-side · Round Robin + Knockout',
    prize_note: '1st $15,000 · 2nd $7,000 + trophies & medals',
    seedMatches: true,
    teams: [
      'BCT Punjab',
      'BCT Hurricanes',
      'Van City Pro',
      'Juba FC',
      'Strathcona Primo FC',
      'Joyous FC',
      'Temple United Pegasus',
      'Strive Academy',
      'BB5',
      'FC Faly Burundi',
      'Mex United FC',
    ],
  },
  {
    name: 'Div 1 Gold',
    slug: 'div-1-gold',
    age_group: 'Adult',
    gender: 'MALE',
    format: '11-a-side · Round Robin + Knockout',
    prize_note: '1st $5,000 · 2nd $3,000 + trophies & medals',
    seedMatches: true,
    teams: [
      'BCT Tigers',
      'BCT Mahilpur United',
      'BCT Elite',
      'BCT Somali',
      'United Punjab SC Winnipeg',
      'Punjab Warriors FC Edmonton',
      'SFC Royals',
      'Akal FC',
      'AUSC',
      'BCT Supra',
      'Ares AFA',
      'Temple United',
      'Unicorn Richmond',
      'GN Sporting',
    ],
  },
  {
    name: 'Div 2 Silver',
    slug: 'div-2-silver',
    age_group: 'Adult',
    gender: 'MALE',
    format: '11-a-side',
    prize_note: '1st $2,000 · 2nd $1,000 + trophies & medals',
    seedMatches: true,
    teams: [
      'BCT Westside',
      'SFC Elite',
      'Skyview FC Calgary',
      'Naita FC Fiji',
      'AC Richmond',
      'Rho FC',
      'Roomi FC',
      'Temple FC',
      'BC Tigers FC U19',
      'GVU Punjab',
      'GVU Phoenix',
      'GVU Lightning U19',
      'Brampton United',
    ],
  },
  {
    name: 'Div 3 Bronze',
    slug: 'div-3-bronze',
    age_group: 'Adult',
    gender: 'MALE',
    format: '11-a-side',
    prize_note: '1st $750 · 2nd $400 + trophies & medals',
    teams: [
      'Luxe FC',
      'Panthers FC',
      'Dasmesh United',
      'North Surrey Mustangs',
      'Rise Football Academy',
    ],
  },
  {
    name: 'U18 Boys',
    slug: 'u18-boys',
    age_group: 'U18',
    gender: 'MALE',
    format: '11-a-side · 3 games minimum',
    prize_note: 'Participation medals for all players',
    seedMatches: true,
    playersPerTeam: YOUTH_PLAYERS_PER_TEAM,
    teams: [
      'BCT Tigers U18',
      'GVU Lightning U18',
      'Delta FC Select',
      'Surrey United U18',
      'Abbotsford SC U18',
      'Coquitlam Wolves U18',
    ],
  },
  {
    name: 'U15 Girls',
    slug: 'u15-girls',
    age_group: 'U15',
    gender: 'FEMALE',
    format: '9-a-side',
    prize_note: 'Participation medals for all players',
    seedMatches: true,
    playersPerTeam: YOUTH_PLAYERS_PER_TEAM,
    teams: [
      'BCT Tigers U15 Girls',
      'Surrey Storm U15',
      'Langley United U15',
      'Richmond Eclipse U15',
    ],
  },
  {
    name: 'Recreational',
    slug: 'recreational',
    age_group: 'Adult',
    gender: 'MIXED',
    format: '6-a-side recreational',
    prize_note: 'Medals — winners & finalists',
    playersPerTeam: REC_PLAYERS_PER_TEAM,
    teams: ['Rick Hansen FC', 'Family Soccer FC', 'Newton Neighbours FC', 'Friday Night FC'],
  },
  {
    name: 'Over 40',
    slug: 'over-40',
    age_group: '40+',
    gender: 'MALE',
    format: '8-a-side masters',
    prize_note: 'Trophy & medals — winners & finalists',
    teams: [
      'BC Tigers FC Masters',
      'BCT Waka FC',
      'Vancouver Stars',
      'America Allstars',
      'GVU Masters',
      'Akal FC Masters',
      'Akal United',
      'Newton FC',
    ],
  },
  {
    name: 'Over 45',
    slug: 'over-45',
    age_group: '45+',
    gender: 'MALE',
    format: '8-a-side masters',
    prize_note: 'Trophy & medals — winners & finalists',
    teams: ['Cloverdale FC', 'GVU Veterans', 'Surrey Classics'],
  },
];

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
  const totalCombos = firstNames.length * LAST_NAMES.length;
  if (offset >= totalCombos) {
    throw new Error(`Not enough unique seeded player names for ${gender.toLowerCase()} rosters.`);
  }
  return {
    first_name: firstNames[offset % firstNames.length],
    last_name: LAST_NAMES[Math.floor(offset / firstNames.length)],
  };
}

function playerDob(ageGroup: string, index: number): Date {
  const year =
    ageGroup === 'U18' ? 2008 - (index % 2)
    : ageGroup === 'U15' ? 2011 - (index % 2)
    : ageGroup === '40+' ? 1978 - (index % 5)
    : ageGroup === '45+' ? 1973 - (index % 5)
    : 1995 - (index % 8);
  return new Date(year, (index * 3) % 12, 5 + (index % 20));
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
  homeName: string;
  awayName: string;
  day: number;
  hour: number;
  minute?: number;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  streamUrl?: string;
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

async function seedPlannedMatches(
  tournamentId: string,
  divisionId: string,
  teams: TeamRecord[],
  players: PlayerRecord[],
  venueId: string,
  fieldIds: string[],
  fixtures: FixturePlan[],
) {
  for (let i = 0; i < fixtures.length; i++) {
    const fx = fixtures[i];
    const home = teamByName(teams, fx.homeName);
    const away = teamByName(teams, fx.awayName);
    const official = REFEREES[i % REFEREES.length];

    const match = await prisma.match.create({
      data: {
        tournament_id: tournamentId,
        division_id: divisionId,
        home_team_id: home.id,
        away_team_id: away.id,
        venue_id: venueId,
        field_id: fieldIds[i % fieldIds.length],
        scheduled_start: cupDate(fx.day, fx.hour, fx.minute ?? 0),
        scheduled_end: cupDate(fx.day, fx.hour + 1, 45),
        status: fx.status,
        round: Math.floor(i / 2) + 1,
        match_type: fx.status === 'LIVE' ? 'Pool play' : 'Pool play',
        home_score: fx.homeScore,
        away_score: fx.awayScore,
        stream_url: fx.streamUrl,
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

    if (fx.status === 'COMPLETED' || fx.status === 'LIVE') {
      await createGoalEvents(match.id, home.id, away.id, fx.homeScore, fx.awayScore, players);
    }
  }
}

function buildDefaultFixtures(teams: TeamRecord[]): FixturePlan[] {
  const pairs = roundRobin(teams.map((t) => t.name)).slice(0, 6);
  const scheduleSlots = [
    { day: 3, hour: 19, minute: 30 },
    { day: 4, hour: 9, minute: 0 },
    { day: 4, hour: 11, minute: 30 },
    { day: 4, hour: 14, minute: 0 },
    { day: 5, hour: 10, minute: 0 },
    { day: 5, hour: 13, minute: 0 },
  ];
  const results = [
    { homeScore: 2, awayScore: 1 },
    { homeScore: 1, awayScore: 1 },
    { homeScore: 3, awayScore: 2 },
    { homeScore: 0, awayScore: 2 },
    { homeScore: 2, awayScore: 0 },
    { homeScore: 4, awayScore: 3 },
  ];

  return pairs.map((pair, i) => ({
    homeName: pair[0],
    awayName: pair[1],
    ...scheduleSlots[i],
    status: (i < 3 ? 'COMPLETED' : i === 3 ? 'LIVE' : 'SCHEDULED') as MatchStatus,
    ...results[i],
    streamUrl: i === 3 ? 'https://www.youtube.com/embed/live_stream' : undefined,
  }));
}

const DIV_1_GOLD_FIXTURES: FixturePlan[] = [
  { homeName: 'BCT Tigers', awayName: 'BCT Mahilpur United', day: 3, hour: 20, status: 'COMPLETED', homeScore: 2, awayScore: 1 },
  { homeName: 'BCT Elite', awayName: 'BCT Somali', day: 4, hour: 9, status: 'COMPLETED', homeScore: 1, awayScore: 1 },
  { homeName: 'United Punjab SC Winnipeg', awayName: 'SFC Royals', day: 4, hour: 11, minute: 30, status: 'COMPLETED', homeScore: 3, awayScore: 2 },
  {
    homeName: 'BCT Tigers',
    awayName: 'Punjab Warriors FC Edmonton',
    day: 4,
    hour: 15,
    status: 'LIVE',
    homeScore: 1,
    awayScore: 0,
    streamUrl: 'https://www.youtube.com/embed/live_stream',
  },
  { homeName: 'Akal FC', awayName: 'AUSC', day: 5, hour: 10, status: 'SCHEDULED', homeScore: 0, awayScore: 0 },
  { homeName: 'Temple United', awayName: 'Unicorn Richmond', day: 5, hour: 13, status: 'SCHEDULED', homeScore: 0, awayScore: 0 },
];

const PREMIER_FIXTURES: FixturePlan[] = [
  { homeName: 'BCT Punjab', awayName: 'BCT Hurricanes', day: 3, hour: 18, status: 'COMPLETED', homeScore: 1, awayScore: 0 },
  { homeName: 'Van City Pro', awayName: 'Juba FC', day: 4, hour: 10, status: 'COMPLETED', homeScore: 2, awayScore: 2 },
  { homeName: 'Strathcona Primo FC', awayName: 'Joyous FC', day: 4, hour: 13, status: 'COMPLETED', homeScore: 3, awayScore: 1 },
  { homeName: 'Temple United Pegasus', awayName: 'Strive Academy', day: 4, hour: 16, status: 'LIVE', homeScore: 2, awayScore: 1, streamUrl: 'https://www.youtube.com/embed/live_stream' },
  { homeName: 'BB5', awayName: 'FC Faly Burundi', day: 5, hour: 11, status: 'SCHEDULED', homeScore: 0, awayScore: 0 },
  { homeName: 'Mex United FC', awayName: 'BCT Punjab', day: 5, hour: 15, status: 'SCHEDULED', homeScore: 0, awayScore: 0 },
];

async function main() {
  console.log('Seeding Miri Piri 2026 tournament data...');

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

  const adminUser = await prisma.user.create({
    data: {
      first_name: 'BC Tigers',
      last_name: 'Admin',
      email: 'admin@bctigers.ca',
      password_hash: await bcrypt.hash('Admin1234!', 12),
      role: 'ADMIN',
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

  const venue = await prisma.venue.create({ data: VENUE });
  const fields = await Promise.all(
    FIELDS.map((f) =>
      prisma.field.create({
        data: { venue_id: venue.id, name: f.name, surface: f.surface, capacity: 500 },
      }),
    ),
  );
  const fieldIds = fields.map((f) => f.id);

  console.log(`  Venue: ${venue.name} (${fields.length} fields)`);

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

  for (const divConfig of DIVISIONS) {
    const seededTeamNames = divConfig.teams.slice(0, SEED_MAX_TEAMS_PER_DIVISION);
    const teamDefs = buildTeams(seededTeamNames, divisionIndex * 3);
    const colors = PALETTE[divisionIndex % PALETTE.length];
    const playersPerTeam = divConfig.playersPerTeam ?? ADULT_PLAYERS_PER_TEAM;

    const division = await prisma.division.create({
      data: {
        tournament_id: tournament.id,
        name: divConfig.name,
        slug: divConfig.slug,
        age_group: divConfig.age_group,
        gender: divConfig.gender,
        max_teams: Math.max(16, teamDefs.length),
        format: `${divConfig.format} · ${divConfig.prize_note}`,
        points_win: 3,
        points_draw: 1,
        points_loss: 0,
        primary_color: colors.primary,
        accent_color: colors.accent,
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
      let fixtures: FixturePlan[];
      if (divConfig.slug === 'div-1-gold') {
        fixtures = DIV_1_GOLD_FIXTURES.filter(
          (f) => teamRecords.some((t) => t.name === f.homeName) && teamRecords.some((t) => t.name === f.awayName),
        );
      } else if (divConfig.slug === 'premier') {
        fixtures = PREMIER_FIXTURES.filter(
          (f) => teamRecords.some((t) => t.name === f.homeName) && teamRecords.some((t) => t.name === f.awayName),
        );
      } else {
        fixtures = buildDefaultFixtures(teamRecords);
      }

      await seedPlannedMatches(
        tournament.id,
        division.id,
        teamRecords,
        allPlayers,
        venue.id,
        fieldIds,
        fixtures,
      );
      await recalculateStandings(division.id);
      matchDivisions++;
    }

    divisionIndex++;
  }

  console.log(`  ${DIVISIONS.length} divisions, ${totalTeams} teams, ${totalPlayers} players.`);
  console.log(`  Schedules seeded in ${matchDivisions} divisions (live + completed + upcoming).`);

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
          'Free parking on site via 128 Street. Premier and Div 1 Gold pool play on Fields 1–2; ' +
          'youth divisions on Fields 3–4. Schedules update live on the tournament hub.',
        type: 'INFO',
      },
      {
        tournament_id: tournament.id,
        title: 'Live scores on the hub',
        message:
          'Follow live scores from Newton Athletic Park on the home page ticker. ' +
          'Div 1 Gold feature match: BCT Tigers vs Punjab Warriors FC Edmonton.',
        type: 'INFO',
      },
    ],
  });

  console.log('\nSeed complete.');
  console.log('  Hub: /tournaments/miri-piri-2026');
  console.log('  Admin: admin@bctigers.ca / Admin1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
