import 'dotenv/config';
import { PrismaClient, type Gender } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import {
  MIRI_PIRI_DIVISIONS,
  VENUE_FIELDS,
  type SeedDivision,
} from './data/miri-piri-2026';
import {
  MIRI_PIRI_MINI_DIVISIONS,
  MINI_VENUE_FIELDS,
} from './data/miri-piri-mini-2026';

// Main adult/youth divisions plus the U5–U12 mini (kids) divisions.
const ALL_DIVISIONS: SeedDivision[] = [
  ...MIRI_PIRI_DIVISIONS,
  ...MIRI_PIRI_MINI_DIVISIONS,
];
// Union of every field referenced across both schedules (deduped, sorted).
const ALL_FIELDS: string[] = Array.from(
  new Set([...VENUE_FIELDS, ...MINI_VENUE_FIELDS]),
).sort();

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

/** Miri Piri 2026 — July 3–5 (Pacific local). `day` is the day-of-month in July. */
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

// Each park is its own venue. Only the "NAP …" fields belong to Newton Athletic
// Park; Hjorth and Strawberry Hill are separate sites.
const VENUES: Array<{
  name: string;
  slug: string;
  address: string;
  city: string;
  parking_info: string;
  matches: (fieldName: string) => boolean;
}> = [
  {
    name: 'Newton Athletic Park',
    slug: 'newton-athletic-park',
    address: '7395 128 St',
    city: 'Surrey, BC V3W 2M7',
    parking_info:
      'Free parking on site (enter from 128 Street). Additional parking across the street at FD Sinclair School.',
    matches: (f) => f.toUpperCase().startsWith('NAP'),
  },
  {
    name: 'Hjorth Road Park',
    slug: 'hjorth-road-park',
    address: '9111 Hjorth Rd',
    city: 'Surrey, BC',
    parking_info: 'On-site and street parking available.',
    matches: (f) => {
      const u = f.toUpperCase();
      return u.includes('HJORTH') || u.includes('HORTH');
    },
  },
  {
    name: 'Strawberry Hill Park',
    slug: 'strawberry-hill-park',
    address: '7548 120 St',
    city: 'Surrey, BC',
    parking_info: 'On-site parking available.',
    matches: (f) => f.toUpperCase().includes('STRAWBERRY'),
  },
];

function venueForField(fieldName: string) {
  return VENUES.find((v) => v.matches(fieldName)) ?? VENUES[0];
}

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
  if (n.includes('BURNABY')) return 'Burnaby, BC';
  if (n.includes('LANGLEY')) return 'Langley, BC';
  if (n.includes('VANCOUVER') || n.includes('VAN CITY')) return 'Vancouver, BC';
  if (n.includes('CLOVERDALE')) return 'Cloverdale, BC';
  if (n.includes('ABBOTSFORD')) return 'Abbotsford, BC';
  if (n.includes('DELTA')) return 'Delta, BC';
  return 'Surrey, BC';
}

function fieldSurface(name: string): string {
  const n = name.toUpperCase();
  if (n.includes('TURF') || n.includes('MINI')) return 'Turf';
  if (n.includes('STRAWBERRY') || n.includes('HJORTH') || n.includes('HORTH')) return 'Natural grass';
  return 'Natural grass';
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

// Names repeat across teams (rosters are demo data); uniqueness is only enforced
// per-team via the slug, so we simply wrap around the name pool.
function seededName(gender: Gender, offset: number) {
  const firstNames = firstNamesForGender(gender);
  const totalCombos = firstNames.length * LAST_NAMES.length;
  const o = offset % totalCombos;
  return {
    first_name: firstNames[o % firstNames.length],
    last_name: LAST_NAMES[Math.floor(o / firstNames.length) % LAST_NAMES.length],
  };
}

function playerDob(ageGroup: string, index: number): Date {
  const u = /U(\d+)/.exec(ageGroup);
  let year: number;
  if (u) {
    year = 2026 - Number(u[1]) + (index % 2);
  } else if (ageGroup === '40+') {
    year = 1980 - (index % 6);
  } else if (ageGroup === '45+') {
    year = 1975 - (index % 6);
  } else if (ageGroup === '60+') {
    year = 1962 - (index % 5);
  } else {
    year = 1995 - (index % 8);
  }
  return new Date(year, (index * 3) % 12, 5 + (index % 20));
}

function makePlayers(teamSlug: string, count: number, gender: Gender, ageGroup: string) {
  const start = PLAYER_NAME_CURSOR[gender];
  PLAYER_NAME_CURSOR[gender] += count;
  return Array.from({ length: count }, (_, i) => {
    const { first_name, last_name } = seededName(gender, start + i);
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

function playersPerTeamFor(div: SeedDivision): number {
  if (/U\d+/.test(div.age_group)) return 12; // youth
  if (div.slug === 'recreational') return 10;
  if (div.format.toUpperCase().includes('EXHIBITION')) return 14;
  return 15; // adult
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

// Default admin credentials are for local/demo seeding only. In production,
// provide SEED_ADMIN_PASSWORD / SEED_SUPERADMIN_PASSWORD via env so the seeded
// accounts don't ship with publicly-known passwords.
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';
const SUPERADMIN_PASSWORD =
  process.env.SEED_SUPERADMIN_PASSWORD ?? 'SuperAdmin1234!';
const usingDefaultAdminPasswords =
  !process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_SUPERADMIN_PASSWORD;

async function main() {
  // This seed is destructive — it wipes every table before inserting demo data.
  // Guard against accidentally running it against a production database.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error(
      'Refusing to run destructive seed with NODE_ENV=production. ' +
        'Set ALLOW_PROD_SEED=true to override (this DELETES all data).',
    );
  }
  if (process.env.NODE_ENV === 'production' && usingDefaultAdminPasswords) {
    throw new Error(
      'Refusing to seed default admin passwords in production. ' +
        'Set SEED_ADMIN_PASSWORD and SEED_SUPERADMIN_PASSWORD to strong values.',
    );
  }

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
  await prisma.group.deleteMany();
  await prisma.division.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.field.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();
  console.log('  Cleared existing data.');

  const { usfa: usfaFormat } = await ensurePointFormats();
  console.log('  Point formats ready.');

  const adminUser = await prisma.user.create({
    data: {
      first_name: 'BC Tigers',
      last_name: 'Admin',
      email: 'admin@bctigers.ca',
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
      email: 'superadmin@bctigers.ca',
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

  const venueIdBySlug = new Map<string, string>();
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
    venueIdBySlug.set(v.slug, created.id);
  }
  const primaryVenueId = venueIdBySlug.get('newton-athletic-park')!;

  const fieldIdByName = new Map<string, string>();
  const venueIdByField = new Map<string, string>();
  for (const name of ALL_FIELDS) {
    const venueId = venueIdBySlug.get(venueForField(name).slug)!;
    const field = await prisma.field.create({
      data: { venue_id: venueId, name, surface: fieldSurface(name), capacity: 500 },
    });
    fieldIdByName.set(name, field.id);
    venueIdByField.set(name, venueId);
  }
  console.log(`  ${VENUES.length} venues, ${ALL_FIELDS.length} fields.`);

  // Tournament has not started yet — everything is scheduled for July 3–5, 2026.
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
      status: 'UPCOMING',
      tournament_type: 'GROUP_STAGE_PLUS_KNOCKOUT',
      rules: TOURNAMENT_RULES,
      created_by: adminUser.id,
    },
  });
  console.log(`  Tournament: ${tournament.name} (${tournament.status})`);

  let totalTeams = 0;
  let totalPlayers = 0;
  let totalMatches = 0;
  let totalGroups = 0;

  let divisionIndex = 0;
  for (const div of ALL_DIVISIONS) {
    const colors = PALETTE[divisionIndex % PALETTE.length];

    const division = await prisma.division.create({
      data: {
        tournament_id: tournament.id,
        name: div.name,
        slug: div.slug,
        age_group: div.age_group,
        gender: div.gender,
        max_teams: Math.max(16, div.teams.length),
        format: div.format,
        point_format_id: usfaFormat.id,
        primary_color: colors.primary,
        accent_color: colors.accent,
        schedule_only: div.schedule_only,
        groups_enabled: div.groups_enabled,
        display_order: div.order,
      },
    });

    // Groups (pools) for this division.
    const groupIdByName = new Map<string, string>();
    if (div.groups_enabled) {
      for (let gi = 0; gi < div.pools.length; gi++) {
        const poolName = div.pools[gi];
        const group = await prisma.group.create({
          data: {
            division_id: division.id,
            name: poolName,
            slug: slugify(poolName),
            order: gi,
          },
        });
        groupIdByName.set(poolName, group.id);
        totalGroups++;
      }
    }

    // Teams.
    const teamIdByName = new Map<string, { id: string; groupId: string | null }>();
    for (let ti = 0; ti < div.teams.length; ti++) {
      const t = div.teams[ti];
      const teamColors = PALETTE[(divisionIndex * 3 + ti) % PALETTE.length];
      const groupId = t.pool ? groupIdByName.get(t.pool) ?? null : null;
      const team = await prisma.team.create({
        data: {
          division_id: division.id,
          group_id: groupId,
          name: t.name,
          slug: slugify(`${div.slug}-${t.name}`),
          logo: teamLogoUrl(t.name, teamColors.primary),
          city: inferCity(t.name),
          founded_year: 2010 + (divisionIndex % 12),
          primary_color: teamColors.primary,
          created_by: adminUser.id,
        },
      });
      teamIdByName.set(t.name, { id: team.id, groupId });

      const playerDefs = makePlayers(
        team.slug,
        playersPerTeamFor(div),
        div.gender,
        div.age_group,
      );
      await prisma.player.createMany({
        data: playerDefs.map((p) => ({ ...p, team_id: team.id, active: true })),
      });
      totalPlayers += playerDefs.length;
    }
    totalTeams += div.teams.length;

    // Zeroed standings (tournament hasn't started).
    await prisma.standing.createMany({
      data: Array.from(teamIdByName.values()).map((t) => ({
        division_id: division.id,
        group_id: t.groupId,
        team_id: t.id,
        rank: 0,
      })),
    });

    // Pool / round-robin fixtures — all scheduled, no scores.
    let refIndex = 0;
    for (const m of div.matches) {
      const home = teamIdByName.get(m.home);
      const away = teamIdByName.get(m.away);
      if (!home || !away) continue;
      const groupId = m.pool ? groupIdByName.get(m.pool) ?? null : null;
      const start = cupDate(m.day, m.hour, m.minute);
      const end = new Date(start.getTime() + 105 * 60 * 1000);

      const match = await prisma.match.create({
        data: {
          tournament_id: tournament.id,
          division_id: division.id,
          home_team_id: home.id,
          away_team_id: away.id,
          group_id: groupId,
          venue_id: m.field ? venueIdByField.get(m.field) ?? primaryVenueId : primaryVenueId,
          field_id: m.field ? fieldIdByName.get(m.field) ?? null : null,
          scheduled_start: start,
          scheduled_end: end,
          status: 'SCHEDULED',
          round: m.game,
          match_type: m.pool ? 'Pool play' : 'Round robin',
          home_score: 0,
          away_score: 0,
        },
      });

      const main = REFEREES[refIndex % REFEREES.length];
      const ar = REFEREES[(refIndex + 1) % REFEREES.length];
      await prisma.matchOfficial.createMany({
        data: [
          { match_id: match.id, name: `${main.first_name} ${main.last_name}`, role: 'MAIN', email: main.email },
          { match_id: match.id, name: `${ar.first_name} ${ar.last_name}`, role: 'AR1' },
        ],
      });
      refIndex++;
      totalMatches++;
    }

    divisionIndex++;
  }

  console.log(
    `  ${ALL_DIVISIONS.length} divisions (${MIRI_PIRI_DIVISIONS.length} main + ${MIRI_PIRI_MINI_DIVISIONS.length} mini), ` +
      `${totalGroups} groups, ${totalTeams} teams, ${totalPlayers} players.`,
  );
  console.log(`  ${totalMatches} pool fixtures scheduled (all upcoming, no scores).`);

  await prisma.announcement.createMany({
    data: [
      {
        tournament_id: tournament.id,
        title: 'Welcome to the 14th Annual Miri Piri Soccer Tournament',
        message:
          'July 3–5, 2026 at Newton Athletic Park, Surrey. Check-in opens 90 minutes before your first game. ' +
          'District team entry deadline was June 15, 2026.',
        type: 'INFO',
      },
      {
        tournament_id: tournament.id,
        title: 'Saturday & Sunday lunch provided',
        message:
          'Free appetizers and lunch for all registered teams on Saturday and Sunday. ' +
          'Head to the BC Tigers FC hospitality tent near NAP 1.',
        type: 'INFO',
      },
      {
        tournament_id: tournament.id,
        title: 'Parking & schedule',
        message:
          'Free parking on site via 128 Street, plus overflow parking across the street at FD Sinclair School. ' +
          'Please check your schedule 24 hours before kickoff to confirm any field or time changes.',
        type: 'INFO',
      },
    ],
  });

  console.log('\nSeed complete.');
  console.log('  Hub: /tournaments/miri-piri-2026');
  if (usingDefaultAdminPasswords) {
    console.log('  Admin: admin@bctigers.ca / Admin1234!');
    console.log('  Super Admin: superadmin@bctigers.ca / SuperAdmin1234!');
  } else {
    console.log('  Admin: admin@bctigers.ca / (from SEED_ADMIN_PASSWORD)');
    console.log('  Super Admin: superadmin@bctigers.ca / (from SEED_SUPERADMIN_PASSWORD)');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
