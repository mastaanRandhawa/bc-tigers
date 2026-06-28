/**
 * Idempotent patch that ADDS the U5–U12 mini (kids) divisions to the existing
 * Miri Piri 2026 tournament without wiping any existing data.
 *
 * For each mini division (keyed by slug), if it doesn't already exist it creates
 * the division, teams, rosters, zeroed standings, and scheduled fixtures. Fields
 * referenced by the mini schedule are created under Newton Athletic Park if
 * missing. Safe to run multiple times.
 *
 * Usage: ts-node --transpile-only prisma/patch-mini-2026.ts
 */
import 'dotenv/config';
import { PrismaClient, type Gender } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  MIRI_PIRI_MINI_DIVISIONS,
  MINI_VENUE_FIELDS,
} from './data/miri-piri-mini-2026';

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
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function hexToRgb(hex: string) {
  const v = hex.replace('#', '');
  const f = v.length === 3 ? v.split('').map((c) => `${c}${c}`).join('') : v;
  return { r: parseInt(f.slice(0, 2), 16), g: parseInt(f.slice(2, 4), 16), b: parseInt(f.slice(4, 6), 16) };
}
function teamLogoUrl(name: string, primaryColor: string) {
  const { r, g, b } = hexToRgb(primaryColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = luminance > 0.6 ? '111827' : 'ffffff';
  const params = new URLSearchParams({
    name, background: primaryColor.replace('#', ''), color: textColor,
    bold: 'true', rounded: 'true', size: '256', format: 'png',
  });
  return `https://ui-avatars.com/api/?${params.toString()}`;
}
function cupDate(day: number, hour = 10, minute = 0) {
  return new Date(2026, 6, day, hour, minute, 0);
}
function inferCity(teamName: string): string {
  const n = teamName.toUpperCase();
  if (n.includes('WCSC') || n.includes('WESTMINSTER')) return 'New Westminster, BC';
  if (n.includes('SURREY')) return 'Surrey, BC';
  if (n.includes('VANCOUVER') || n.includes('VAN ')) return 'Vancouver, BC';
  return 'Surrey, BC';
}
const PALETTE = [
  '#F48735', '#7C3AED', '#0D9488', '#DC2626', '#2563EB', '#CA8A04', '#DB2777', '#4F46E5',
];
const ACCENTS = [
  '#FEF3EB', '#F3E8FF', '#CCFBF1', '#FEE2E2', '#DBEAFE', '#FEF9C3', '#FCE7F3', '#E0E7FF',
];

const FIRST_NAMES_M = [
  'Harjot', 'Gurpreet', 'Aman', 'Navdeep', 'Karan', 'Ravi', 'Arjun', 'Dev', 'Raj', 'Vikram',
  'Kabir', 'Sukhman', 'Param', 'Ekam', 'Noah', 'Liam', 'Milan', 'Sahil', 'Aarav', 'Krish',
];
const FIRST_NAMES_F = [
  'Simran', 'Priya', 'Ananya', 'Kiran', 'Meera', 'Neha', 'Riya', 'Aisha', 'Maya', 'Jiya',
  'Diya', 'Amrita', 'Navya', 'Isha', 'Avani', 'Zoya', 'Heer', 'Reet', 'Anika', 'Kavya',
];
const LAST_NAMES = [
  'Singh', 'Kaur', 'Gill', 'Sandhu', 'Bains', 'Dhaliwal', 'Mangat', 'Virk', 'Toor', 'Sekhon',
  'Sidhu', 'Brar', 'Pannu', 'Chahal', 'Deol', 'Grewal', 'Johal', 'Atwal', 'Dhillon', 'Saini',
];
const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'ST', 'CDM'] as const;
const cursor: Record<Gender, number> = { MALE: 0, FEMALE: 0, MIXED: 0 };

function makePlayers(teamSlug: string, count: number, gender: Gender, ageGroup: string) {
  const firsts = gender === 'FEMALE' ? FIRST_NAMES_F : FIRST_NAMES_M;
  const start = cursor[gender];
  cursor[gender] += count;
  const u = /U(\d+)/.exec(ageGroup);
  const birthYear = u ? 2026 - Number(u[1]) : 2014;
  return Array.from({ length: count }, (_, i) => {
    const o = (start + i) % (firsts.length * LAST_NAMES.length);
    const first = firsts[o % firsts.length];
    const last = LAST_NAMES[Math.floor(o / firsts.length) % LAST_NAMES.length];
    return {
      first_name: first,
      last_name: last,
      slug: `${slugify(`${first}-${last}`)}-${teamSlug}-${i}`,
      jersey_number: i + 1,
      preferred_position: POSITIONS[i % POSITIONS.length],
      dob: new Date(birthYear + (i % 2), (i * 3) % 12, 5 + (i % 20)),
    };
  });
}

const REFEREES = [
  { first_name: 'Rakesh', last_name: 'Kumar', email: 'rakesh.kumar@bctigers.ca' },
  { first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@bctigers.ca' },
  { first_name: 'David', last_name: 'Chen', email: 'david.chen@bctigers.ca' },
  { first_name: 'Sarah', last_name: 'MacDonald', email: 's.macdonald@bctigers.ca' },
];

async function main() {
  console.log('Adding U5–U12 mini divisions (non-destructive)...');

  const tournament = await prisma.tournament.findUnique({
    where: { slug: 'miri-piri-2026' },
  });
  if (!tournament) throw new Error('Tournament miri-piri-2026 not found. Run the main seed first.');

  const usfa = await prisma.pointFormat.findUnique({ where: { slug: 'usfa-10-point' } });
  if (!usfa) throw new Error('USFA point format not found. Run the main seed first.');

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  // Newton Athletic Park holds all mini fields ("NAP …", "NAP MINI TURF …").
  const venue = await prisma.venue.findUnique({ where: { slug: 'newton-athletic-park' } });
  if (!venue) throw new Error('Newton Athletic Park venue not found. Run the main seed first.');

  // Ensure every mini field exists.
  const fieldIdByName = new Map<string, string>();
  for (const name of MINI_VENUE_FIELDS) {
    const existing = await prisma.field.findFirst({ where: { name } });
    if (existing) {
      fieldIdByName.set(name, existing.id);
      continue;
    }
    const created = await prisma.field.create({
      data: {
        venue_id: venue.id,
        name,
        surface: name.toUpperCase().includes('TURF') ? 'Turf' : 'Natural grass',
        capacity: 300,
      },
    });
    fieldIdByName.set(name, created.id);
  }

  let createdDivs = 0;
  let skipped = 0;
  let totalTeams = 0;
  let totalMatches = 0;

  let idx = 0;
  for (const div of MIRI_PIRI_MINI_DIVISIONS) {
    idx++;
    const exists = await prisma.division.findFirst({
      where: { tournament_id: tournament.id, slug: div.slug },
    });
    if (exists) {
      skipped++;
      continue;
    }

    const division = await prisma.division.create({
      data: {
        tournament_id: tournament.id,
        name: div.name,
        slug: div.slug,
        age_group: div.age_group,
        gender: div.gender,
        max_teams: Math.max(8, div.teams.length),
        format: div.format,
        point_format_id: usfa.id,
        primary_color: PALETTE[idx % PALETTE.length],
        accent_color: ACCENTS[idx % ACCENTS.length],
        schedule_only: div.schedule_only,
        groups_enabled: div.groups_enabled,
        display_order: div.order,
      },
    });
    createdDivs++;

    const teamIdByName = new Map<string, string>();
    for (let ti = 0; ti < div.teams.length; ti++) {
      const t = div.teams[ti];
      const color = PALETTE[(idx * 3 + ti) % PALETTE.length];
      const team = await prisma.team.create({
        data: {
          division_id: division.id,
          name: t.name,
          slug: slugify(`${div.slug}-${t.name}`),
          logo: teamLogoUrl(t.name, color),
          city: inferCity(t.name),
          founded_year: 2024,
          primary_color: color,
          created_by: adminUser?.id ?? null,
        },
      });
      teamIdByName.set(t.name, team.id);

      const players = makePlayers(team.slug, 12, div.gender, div.age_group);
      await prisma.player.createMany({
        data: players.map((p) => ({ ...p, team_id: team.id, active: true })),
      });
    }
    totalTeams += div.teams.length;

    await prisma.standing.createMany({
      data: Array.from(teamIdByName.values()).map((teamId) => ({
        division_id: division.id,
        team_id: teamId,
        rank: 0,
      })),
    });

    let refIndex = 0;
    for (const m of div.matches) {
      const homeId = teamIdByName.get(m.home);
      const awayId = teamIdByName.get(m.away);
      if (!homeId || !awayId) continue;
      const start = cupDate(m.day, m.hour, m.minute);
      const match = await prisma.match.create({
        data: {
          tournament_id: tournament.id,
          division_id: division.id,
          home_team_id: homeId,
          away_team_id: awayId,
          venue_id: venue.id,
          field_id: m.field ? fieldIdByName.get(m.field) ?? null : null,
          scheduled_start: start,
          scheduled_end: new Date(start.getTime() + 70 * 60 * 1000),
          status: 'SCHEDULED',
          round: m.game,
          match_type: 'Round robin',
          home_score: 0,
          away_score: 0,
        },
      });
      const main = REFEREES[refIndex % REFEREES.length];
      await prisma.matchOfficial.create({
        data: { match_id: match.id, name: `${main.first_name} ${main.last_name}`, role: 'MAIN', email: main.email },
      });
      refIndex++;
      totalMatches++;
    }
  }

  console.log(
    `  Mini divisions: +${createdDivs} created, ${skipped} already existed. ` +
      `${totalTeams} teams, ${totalMatches} fixtures added.`,
  );
  console.log('\nPatch complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
