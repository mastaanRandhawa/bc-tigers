/**
 * Idempotent patch for the already-seeded Miri Piri 2026 data. Unlike seed.ts
 * this does NOT wipe anything — it only applies targeted changes:
 *   1. Every division uses the USFA 10-point system.
 *   2. Each park is its own venue (only "NAP …" fields stay at Newton Athletic
 *      Park); existing fields and their matches are re-pointed accordingly.
 *
 * Safe to run multiple times.  Usage: ts-node --transpile-only prisma/patch-2026.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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

const VENUES = [
  {
    name: 'Newton Athletic Park',
    slug: 'newton-athletic-park',
    address: '7395 128 St',
    city: 'Surrey, BC V3W 2M7',
    parking_info:
      'Free parking on site (enter from 128 Street). Additional parking across the street at FD Sinclair School.',
    matches: (f: string) => f.toUpperCase().startsWith('NAP'),
  },
  {
    name: 'Hjorth Road Park',
    slug: 'hjorth-road-park',
    address: '9111 Hjorth Rd',
    city: 'Surrey, BC',
    parking_info: 'On-site and street parking available.',
    matches: (f: string) => {
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
    matches: (f: string) => f.toUpperCase().includes('STRAWBERRY'),
  },
];

function venueForField(fieldName: string) {
  return VENUES.find((v) => v.matches(fieldName)) ?? VENUES[0];
}

async function ensureUsfaFormat() {
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
  return prisma.pointFormat.upsert({
    where: { slug: 'usfa-10-point' },
    create: { id: 'pf-usfa-10-point', slug: 'usfa-10-point', ...usfaData },
    update: usfaData,
  });
}

async function main() {
  console.log('Patching Miri Piri 2026 data (non-destructive)...');

  // 1) All divisions on the 10-point system.
  const usfa = await ensureUsfaFormat();
  const divResult = await prisma.division.updateMany({
    data: { point_format_id: usfa.id },
  });
  console.log(`  Point format: ${divResult.count} divisions set to USFA 10-point.`);

  // 2) Venues per park.
  const venueIdBySlug = new Map<string, string>();
  for (const v of VENUES) {
    const venue = await prisma.venue.upsert({
      where: { slug: v.slug },
      create: {
        name: v.name,
        slug: v.slug,
        address: v.address,
        city: v.city,
        parking_info: v.parking_info,
      },
      update: { name: v.name, address: v.address, city: v.city, parking_info: v.parking_info },
    });
    venueIdBySlug.set(v.slug, venue.id);
  }
  console.log(`  Venues ready: ${VENUES.map((v) => v.name).join(', ')}.`);

  // 3) Re-point fields (and their matches) to the correct venue.
  const fields = await prisma.field.findMany({ select: { id: true, name: true, venue_id: true } });
  let movedFields = 0;
  let movedMatches = 0;
  for (const field of fields) {
    const targetVenueId = venueIdBySlug.get(venueForField(field.name).slug)!;
    if (field.venue_id !== targetVenueId) {
      await prisma.field.update({ where: { id: field.id }, data: { venue_id: targetVenueId } });
      movedFields++;
    }
    const res = await prisma.match.updateMany({
      where: { field_id: field.id, venue_id: { not: targetVenueId } },
      data: { venue_id: targetVenueId },
    });
    movedMatches += res.count;
  }
  console.log(`  Re-pointed ${movedFields} fields and ${movedMatches} matches to their venue.`);

  // Remove now-empty venues that aren't part of the canonical set (e.g. an old
  // single "Newton Athletic Park" that held every field before the split).
  const orphanVenues = await prisma.venue.findMany({
    where: {
      slug: { notIn: VENUES.map((v) => v.slug) },
      fields: { none: {} },
      matches: { none: {} },
    },
    select: { id: true, name: true },
  });
  if (orphanVenues.length > 0) {
    await prisma.venue.deleteMany({ where: { id: { in: orphanVenues.map((v) => v.id) } } });
    console.log(`  Removed ${orphanVenues.length} empty venue(s).`);
  }

  console.log('\nPatch complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
