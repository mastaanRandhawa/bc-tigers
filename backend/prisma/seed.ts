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

const TOURNAMENT_RULES = `14th Annual Miri Piri Soccer Tournament

Hosted by BC Tigers FC in association with BC Soccer.
Dates: July 3–5, 2026
Location: Newton Athletic Park, Surrey, BC

Teams are managed by assigned coaches on their public team pages.
Contact tournament admins to register a team.

Contact: bctigersfc@gmail.com`;

const DIVISIONS = [
  { name: "Men's Premier Division", slug: 'mens-premier', age_group: 'Adult', gender: 'MALE' as const },
  { name: "Men's Division 1", slug: 'mens-div-1', age_group: 'Adult', gender: 'MALE' as const },
  { name: "Women's Division", slug: 'womens', age_group: 'Adult', gender: 'FEMALE' as const },
  { name: 'U19 Boys', slug: 'u19-boys', age_group: 'U19', gender: 'MALE' as const },
  { name: 'U19 Girls', slug: 'u19-girls', age_group: 'U19', gender: 'FEMALE' as const },
  { name: 'U15 Boys', slug: 'u15-boys', age_group: 'U15', gender: 'MALE' as const },
  { name: 'U15 Girls', slug: 'u15-girls', age_group: 'U15', gender: 'FEMALE' as const },
  { name: 'Masters (35+)', slug: 'masters', age_group: 'Masters', gender: 'MALE' as const },
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

async function main() {
  console.log('Seeding platform...');

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

  const adminUser = await prisma.user.create({
    data: {
      first_name: 'BC Tigers',
      last_name: 'Admin',
      email: 'admin@bctigers.ca',
      password_hash: await bcrypt.hash('Admin1234!', 12),
      role: 'ADMIN',
    },
  });

  const coachUser = await prisma.user.create({
    data: {
      first_name: 'Demo',
      last_name: 'Coach',
      email: 'coach@bctigers.ca',
      password_hash: await bcrypt.hash('Coach1234!', 12),
      role: 'COACH',
    },
  });

  const coach = await prisma.coach.create({
    data: {
      first_name: 'Demo',
      last_name: 'Coach',
      email: 'coach@bctigers.ca',
      user_id: coachUser.id,
    },
  });

  await prisma.siteSettings.create({
    data: {
      id: 'default',
      site_name: 'BC Tigers FC',
      contact_email: 'bctigersfc@gmail.com',
      contact_phone: '(604) 240-9742',
      contact_address: '7395 128 St, Surrey, BC V3W 2M7',
      max_teams_per_division: 16,
      registration_open: true,
    },
  });

  const venue = await prisma.venue.create({
    data: {
      name: 'Newton Athletic Park',
      slug: 'newton-athletic-park',
      address: '7395 128 St',
      city: 'Surrey, BC',
      parking_info: 'Free parking available on site.',
    },
  });

  await Promise.all(
    ['Field 1', 'Field 2', 'Field 3', 'Field 4'].map((name) =>
      prisma.field.create({ data: { venue_id: venue.id, name, surface: 'Grass' } }),
    ),
  );

  const tournament = await prisma.tournament.create({
    data: {
      name: '14th Annual Miri Piri Soccer Tournament',
      slug: 'miri-piri-2026',
      description:
        'Miri Piri Canada Soccer Cup — hosted by BC Tigers FC. Browse divisions and follow your teams.',
      start_date: new Date('2026-07-03T18:00:00-07:00'),
      end_date: new Date('2026-07-05T20:00:00-07:00'),
      registration_open_date: new Date('2026-03-01T00:00:00-08:00'),
      registration_close_date: new Date('2026-06-15T23:59:59-07:00'),
      entry_fee: 850,
      location: 'Newton Athletic Park, Surrey, BC',
      status: 'UPCOMING',
      tournament_type: 'GROUP_STAGE_PLUS_KNOCKOUT',
      rules: TOURNAMENT_RULES,
      created_by: adminUser.id,
    },
  });

  const divisionRecords: Awaited<ReturnType<typeof prisma.division.create>>[] = [];
  for (let i = 0; i < DIVISIONS.length; i++) {
    const div = DIVISIONS[i];
    const colors = PALETTE[i % PALETTE.length];
    const record = await prisma.division.create({
      data: {
        tournament_id: tournament.id,
        name: div.name,
        slug: div.slug,
        age_group: div.age_group,
        gender: div.gender,
        max_teams: 16,
        format: 'Round Robin + Knockout',
        primary_color: colors.primary,
        accent_color: colors.accent,
      },
    });
    divisionRecords.push(record);
  }

  const premier = divisionRecords[0];
  const div1 = divisionRecords[1];

  const teamA = await prisma.team.create({
    data: {
      division_id: premier.id,
      name: 'BC Tigers FC',
      slug: 'bc-tigers-fc',
      city: 'Surrey, BC',
      primary_color: '#F48735',
      secondary_color: '#1a1a1a',
      created_by: adminUser.id,
    },
  });

  const teamB = await prisma.team.create({
    data: {
      division_id: div1.id,
      name: 'Miri Piri Select',
      slug: 'miri-piri-select',
      city: 'Vancouver, BC',
      primary_color: '#2563EB',
      secondary_color: '#ffffff',
      created_by: adminUser.id,
    },
  });

  await prisma.teamCoach.createMany({
    data: [
      { team_id: teamA.id, coach_id: coach.id, role: 'Head Coach' },
      { team_id: teamB.id, coach_id: coach.id, role: 'Head Coach' },
    ],
  });

  await prisma.standing.createMany({
    data: [
      { division_id: premier.id, team_id: teamA.id, played: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, goal_difference: 0, points: 0 },
      { division_id: div1.id, team_id: teamB.id, played: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, goal_difference: 0, points: 0 },
    ],
  });

  const players = await Promise.all(
    [
      { first_name: 'Jaspreet', last_name: 'Singh', slug: 'jaspreet-singh', jersey: 10 },
      { first_name: 'Harpreet', last_name: 'Kaur', slug: 'harpreet-kaur', jersey: 7 },
      { first_name: 'Amrit', last_name: 'Gill', slug: 'amrit-gill', jersey: 9 },
    ].map((p) =>
      prisma.player.create({
        data: {
          first_name: p.first_name,
          last_name: p.last_name,
          slug: p.slug,
          jersey_number: p.jersey,
        },
      }),
    ),
  );

  await prisma.teamRoster.create({
    data: {
      team_id: teamA.id,
      player_id: players[0].id,
      active: true,
    },
  });

  console.log('\nSeed complete.');
  console.log('  Tournament: /tournaments/miri-piri-2026');
  console.log('  Coach team: /tournaments/miri-piri-2026/divisions/mens-premier/teams/bc-tigers-fc');
  console.log('  Admin:      admin@bctigers.ca / Admin1234!');
  console.log('  Coach:      coach@bctigers.ca / Coach1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
