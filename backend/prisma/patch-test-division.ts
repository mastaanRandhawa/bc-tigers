/**
 * Creates a temporary division with test teams for bracket / completion testing.
 * Safe to re-run: skips existing division and reuses teams already linked.
 *
 * Usage: npx ts-node --transpile-only prisma/patch-test-division.ts
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

const TOURNAMENT_SLUG = 'miri-piri-2026';
const DIVISION_SLUG = 'temp-test-bracket';
const POINT_FORMAT_ID = 'pf-usfa-10-point';

const TEAM_NAMES = [
  'Test Team Alpha',
  'Test Team Bravo',
  'Test Team Charlie',
  'Test Team Delta',
  'Test Team Echo',
  'Test Team Foxtrot',
  'Test Team Golf',
  'Test Team Hotel',
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlugForDivision(
  divisionId: string,
  base: string,
): Promise<string> {
  let slug = base || 'team';
  let n = 2;
  while (
    await prisma.teamDivision.findUnique({
      where: { division_id_slug: { division_id: divisionId, slug } },
    })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

async function main() {
  const tournament = await prisma.tournament.findFirst({
    where: { slug: TOURNAMENT_SLUG, is_deleted: false },
    select: { id: true, name: true, slug: true },
  });
  if (!tournament) {
    throw new Error(`Tournament not found: ${TOURNAMENT_SLUG}`);
  }

  const maxOrder = await prisma.division.aggregate({
    where: { tournament_id: tournament.id },
    _max: { display_order: true },
  });

  let division = await prisma.division.findFirst({
    where: { tournament_id: tournament.id, slug: DIVISION_SLUG },
  });

  if (!division) {
    division = await prisma.division.create({
      data: {
        tournament_id: tournament.id,
        name: 'Temp Test Bracket',
        slug: DIVISION_SLUG,
        age_group: 'Test',
        gender: 'MALE',
        max_teams: 16,
        format: 'Knockout test sandbox',
        point_format_id: POINT_FORMAT_ID,
        primary_color: '#64748B',
        accent_color: '#F1F5F9',
        groups_enabled: false,
        qualification_zones_enabled: false,
        qualification_advance: 8,
        display_order: (maxOrder._max.display_order ?? 0) + 1,
      },
    });
    console.log(`Created division: ${division.name} (${division.id})`);
  } else {
    console.log(`Division already exists: ${division.name} (${division.id})`);
  }

  const linked: string[] = [];

  for (const name of TEAM_NAMES) {
    let team = await prisma.team.findFirst({
      where: { name, is_deleted: false },
    });

    if (!team) {
      team = await prisma.team.create({
        data: { name, city: 'Test City' },
      });
      console.log(`  Created team: ${name}`);
    }

    const existingMembership = await prisma.teamDivision.findUnique({
      where: {
        team_id_division_id: {
          team_id: team.id,
          division_id: division.id,
        },
      },
    });

    if (!existingMembership) {
      const slug = await uniqueSlugForDivision(
        division.id,
        slugify(name),
      );
      await prisma.teamDivision.create({
        data: {
          team_id: team.id,
          division_id: division.id,
          slug,
        },
      });
      await prisma.standing.upsert({
        where: {
          division_id_team_id: {
            division_id: division.id,
            team_id: team.id,
          },
        },
        create: {
          division_id: division.id,
          team_id: team.id,
          rank: 0,
        },
        update: {},
      });
      console.log(`  Linked: ${name}`);
    }

    linked.push(name);
  }

  const teamCount = await prisma.teamDivision.count({
    where: { division_id: division.id },
  });

  console.log('');
  console.log('── Test sandbox ready ──');
  console.log(`Tournament: ${tournament.name}`);
  console.log(`Division:   ${division.name} (${teamCount} teams)`);
  console.log(`Division ID: ${division.id}`);
  console.log(`Admin URL:  http://localhost:5173/admin/tournaments/${tournament.id}/divisions/${division.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
