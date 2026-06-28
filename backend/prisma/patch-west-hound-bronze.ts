/**
 * Adds WEST HOUND to Div 3 Bronze · Pool B if missing (idempotent).
 *
 * Usage: ts-node --transpile-only prisma/patch-west-hound-bronze.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const TEAM_NAME = 'WEST HOUND';
const DIVISION_SLUG = 'div-3-bronze';
const POOL_NAME = 'Pool B';

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
  return {
    r: parseInt(f.slice(0, 2), 16),
    g: parseInt(f.slice(2, 4), 16),
    b: parseInt(f.slice(4, 6), 16),
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

async function main() {
  const division = await prisma.division.findFirst({
    where: { slug: DIVISION_SLUG, tournament: { slug: 'miri-piri-2026' } },
    include: { groups: true },
  });
  if (!division) throw new Error(`Division ${DIVISION_SLUG} not found`);

  const pool = division.groups.find((g) => g.name === POOL_NAME);
  if (!pool) throw new Error(`${POOL_NAME} not found in ${DIVISION_SLUG}`);

  const existing = await prisma.team.findFirst({
    where: {
      division_id: division.id,
      name: { equals: TEAM_NAME, mode: 'insensitive' },
    },
  });
  if (existing) {
    if (existing.group_id !== pool.id) {
      await prisma.team.update({
        where: { id: existing.id },
        data: { group_id: pool.id },
      });
      console.log(`Moved ${TEAM_NAME} to ${POOL_NAME}.`);
    } else {
      console.log(`${TEAM_NAME} already in ${POOL_NAME}.`);
    }
    return;
  }

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const teamSlug = slugify(`${DIVISION_SLUG}-${TEAM_NAME}`);
  const primaryColor = division.primary_color ?? '#CA8A04';

  const team = await prisma.team.create({
    data: {
      division_id: division.id,
      group_id: pool.id,
      name: TEAM_NAME,
      slug: teamSlug,
      logo: teamLogoUrl(TEAM_NAME, primaryColor),
      city: 'Surrey, BC',
      founded_year: 2018,
      primary_color: primaryColor,
      created_by: admin?.id,
    },
  });

  await prisma.standing.create({
    data: {
      division_id: division.id,
      group_id: pool.id,
      team_id: team.id,
      rank: 0,
    },
  });

  console.log(`Added ${TEAM_NAME} to ${division.name} · ${POOL_NAME}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
