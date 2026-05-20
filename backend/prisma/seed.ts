import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// ── Prisma client (mirrors src/prisma/prisma.ts, standalone for seed) ──────
const connectionString = process.env.DATABASE_URL!;
const isRemote = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');
const adapter = new PrismaPg({ connectionString, ...(isRemote && { ssl: { rejectUnauthorized: false } }) });
const prisma = new PrismaClient({ adapter });

// ── Helpers ─────────────────────────────────────────────────────────────────
function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function days(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function roundRobin(teams: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < teams.length - 1; i++)
    for (let j = i + 1; j < teams.length; j++)
      pairs.push([teams[i], teams[j]]);
  return pairs;
}

// ── Data definitions ─────────────────────────────────────────────────────────

const VENUES = [
  { name: 'Swangard Stadium', address: '3883 Imperial St', city: 'Burnaby', slug: 'swangard-stadium' },
  { name: 'Newton Athletic Park', address: '13730 72nd Ave', city: 'Surrey', slug: 'newton-athletic-park' },
  { name: 'Burnaby Lake Sports Complex', address: '3676 Kensington Ave', city: 'Burnaby', slug: 'burnaby-lake-sports-complex' },
];

const REFEREES = [
  { first_name: 'David', last_name: 'Chen', email: 'david.chen@bctigers.ca', certification: 'National A' },
  { first_name: 'Maria', last_name: 'Santos', email: 'maria.santos@bctigers.ca', certification: 'National A' },
  { first_name: 'James', last_name: 'MacLeod', email: 'james.macleod@bctigers.ca', certification: 'Regional B' },
  { first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@bctigers.ca', certification: 'Regional B' },
  { first_name: 'Luc', last_name: 'Tremblay', email: 'luc.tremblay@bctigers.ca', certification: 'National B' },
  { first_name: 'Amara', last_name: 'Osei', email: 'amara.osei@bctigers.ca', certification: 'Regional A' },
];

const DIVISIONS_CONFIG = [
  {
    name: 'Boys U18 Open',
    slug: 'boys-u18-open',
    age_group: 'U18',
    gender: 'MALE' as const,
    teams: [
      { name: 'FC Coastal United', city: 'Vancouver', primaryColor: '#002D72' },
      { name: 'Pacific Strikers SC', city: 'Burnaby', primaryColor: '#CC0000' },
      { name: 'North Shore United', city: 'North Vancouver', primaryColor: '#006600' },
      { name: 'Fraser Valley Tigers', city: 'Abbotsford', primaryColor: '#FF6600' },
      { name: 'Langley Lions FC', city: 'Langley', primaryColor: '#FFD700' },
      { name: 'Burnaby FC', city: 'Burnaby', primaryColor: '#1B1B1B' },
    ],
  },
  {
    name: 'Girls U16 Select',
    slug: 'girls-u16-select',
    age_group: 'U16',
    gender: 'FEMALE' as const,
    teams: [
      { name: 'Vancouver FC Girls', city: 'Vancouver', primaryColor: '#003DA5' },
      { name: 'Richmond United Girls', city: 'Richmond', primaryColor: '#D4002C' },
      { name: 'Surrey Storm FC', city: 'Surrey', primaryColor: '#2C7A2C' },
      { name: 'Cloverdale Athletic', city: 'Surrey', primaryColor: '#6B2D8B' },
      { name: 'White Rock Wanderers', city: 'White Rock', primaryColor: '#00A3E0' },
      { name: 'Delta FC Academy', city: 'Delta', primaryColor: '#E8401A' },
    ],
  },
];

const FIRST_NAMES_M = ['James', 'Carlos', 'Omar', 'Aiden', 'Lucas', 'Marcus', 'Dylan', 'Ryan', 'Connor', 'Ethan', 'Noah', 'Liam'];
const FIRST_NAMES_F = ['Sofia', 'Emma', 'Zara', 'Maya', 'Claire', 'Leila', 'Ava', 'Chloe', 'Nadia', 'Isabelle', 'Jade', 'Priya'];
const LAST_NAMES = ['Martinez', 'Silva', 'Park', 'Hassan', 'Wilson', 'Chen', 'Nguyen', 'Brown', 'Kim', 'Anderson', 'Taylor', 'Patel', 'Garcia', 'Thompson', 'White', 'Lee', 'Davis', 'Johnson', 'Williams', 'Jones'];

function makePlayers(teamSlug: string, count: number, female: boolean) {
  const firstNames = female ? FIRST_NAMES_F : FIRST_NAMES_M;
  return Array.from({ length: count }, (_, i) => ({
    first_name: firstNames[i % firstNames.length],
    last_name: LAST_NAMES[(i + (female ? 7 : 0)) % LAST_NAMES.length],
    slug: `${firstNames[i % firstNames.length].toLowerCase()}-${LAST_NAMES[(i + (female ? 7 : 0)) % LAST_NAMES.length].toLowerCase()}-${teamSlug}-${i}`,
    jersey_number: i + 1,
    preferred_position: ['GK', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'ST'][i % 12],
    nationality: ['Canadian', 'Canadian', 'Canadian', 'Canadian', 'Canadian', 'Brazilian', 'Mexican', 'Colombian', 'South Korean', 'Ghanaian', 'Indian', 'Vietnamese'][i % 12],
  }));
}

// ── Main seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database...');

  // ── Wipe existing data (order matters due to FK constraints)
  await prisma.passwordResetToken.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.announcement.deleteMany();
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

  // ── Admin user
  const adminUser = await prisma.user.create({
    data: {
      first_name: 'BC Tigers',
      last_name: 'Admin',
      email: 'admin@bctigers.ca',
      password_hash: await bcrypt.hash('Admin1234!', 12),
      role: 'ADMIN',
    },
  });
  console.log(`  Created admin user: ${adminUser.email}`);

  await prisma.siteSettings.create({
    data: {
      id: 'default',
      site_name: 'BC Tigers Soccer',
      contact_email: 'info@bctigers.ca',
      contact_phone: '+1 (604) 555-0100',
      contact_address: '3883 Imperial St, Burnaby, BC V5S 3V5',
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
  console.log(`  Created viewer user: ${viewerUser.email}`);

  // ── Venues
  const venues = await Promise.all(
    VENUES.map((v) => prisma.venue.create({ data: v }))
  );
  console.log(`  Created ${venues.length} venues.`);

  // ── Referees
  const referees = await Promise.all(
    REFEREES.map((r) => prisma.referee.create({ data: r }))
  );
  console.log(`  Created ${referees.length} referees.`);

  // ── Tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: 'BC Tigers Summer Classic 2025',
      slug: 'bc-tigers-summer-classic-2025',
      description: 'The premier summer soccer tournament in British Columbia, bringing together the top youth clubs from across the province.',
      start_date: days(-7),
      end_date: days(21),
      location: 'Metro Vancouver, BC',
      status: 'ACTIVE',
      tournament_type: 'GROUP_STAGE_PLUS_KNOCKOUT',
      rules: 'FIFA Laws of the Game apply. 90-minute matches (45 min halves). Extra time and penalty shootout for knockout rounds.',
      created_by: adminUser.id,
    },
  });
  console.log(`  Created tournament: ${tournament.name}`);

  const announcements = [
    {
      title: 'BC Tigers Summer Cup 2025 Kicks Off This Weekend',
      slug: 'summer-cup-2025-kicks-off',
      category: 'ANNOUNCEMENT' as const,
      excerpt: 'The highly anticipated Summer Classic begins this weekend with 12 teams competing across 2 divisions at venues across the Lower Mainland.',
      content: 'The BC Tigers Summer Classic 2025 opens with round-robin play across Boys U18 Open and Girls U16 Select divisions. All matches will be updated live on the platform.',
      image_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
    },
    {
      title: 'FC Coastal United Dominates Opening Round',
      slug: 'fc-coastal-united-opening-round',
      category: 'RESULTS' as const,
      excerpt: 'FC Coastal United opened their campaign with strong performances in the Boys U18 Open division.',
      content: 'Early results from the Boys U18 Open division show FC Coastal United leading the standings after the first round of fixtures.',
      image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
    },
    {
      title: 'Referee Certification Program Launched',
      slug: 'referee-certification-program',
      category: 'NEWS' as const,
      excerpt: 'BC Tigers partners with BC Soccer Referees Association for a new certification pathway.',
      content: 'Registered referees can now access match assignments through the referee portal after completing certification requirements.',
      image_url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    },
    {
      title: 'Registration Open for Fall League 2025',
      slug: 'fall-league-2025-registration',
      category: 'REGISTRATION' as const,
      excerpt: 'Teams can register for the BC Tigers Fall League 2025. Early bird discounts available.',
      content: 'Registration is now open for the Fall League. Contact info@bctigers.ca for division placement and scheduling.',
      image_url: 'https://images.unsplash.com/photo-1540747913346-19212a4cf528?w=800',
    },
  ];
  await prisma.announcement.createMany({ data: announcements });
  console.log(`  Created ${announcements.length} announcements.`);

  await prisma.media.createMany({
    data: [
      { tournament_id: tournament.id, type: 'PHOTO', url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', title: 'Match Action' },
      { tournament_id: tournament.id, type: 'PHOTO', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800', title: 'Goal Celebration' },
      { tournament_id: tournament.id, type: 'PHOTO', url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', title: 'Kickoff' },
      { tournament_id: tournament.id, type: 'PHOTO', url: 'https://images.unsplash.com/photo-1540747913346-19212a4cf528?w=800', title: 'Team Huddle' },
      { tournament_id: tournament.id, type: 'PHOTO', url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800', title: 'Referee Briefing' },
      { tournament_id: tournament.id, type: 'PHOTO', url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800', title: 'Stadium View' },
    ],
  });
  console.log('  Created gallery media.');

  // ── Divisions, Teams, Players, Matches
  for (const divConfig of DIVISIONS_CONFIG) {
    const division = await prisma.division.create({
      data: {
        tournament_id: tournament.id,
        name: divConfig.name,
        slug: divConfig.slug,
        age_group: divConfig.age_group,
        gender: divConfig.gender,
        max_teams: 8,
        format: 'Round Robin + Knockout',
        points_win: 3,
        points_draw: 1,
        points_loss: 0,
      },
    });

    const isFemale = divConfig.gender === 'FEMALE';

    // Create teams
    const teams = await Promise.all(
      divConfig.teams.map((t) =>
        prisma.team.create({
          data: {
            division_id: division.id,
            name: t.name,
            slug: slug(t.name),
            city: t.city,
            primary_color: t.primaryColor,
            created_by: adminUser.id,
          },
        })
      )
    );

    // Create players and rosters
    for (const team of teams) {
      const playerDefs = makePlayers(team.slug, 12, isFemale);
      for (const pd of playerDefs) {
        const player = await prisma.player.create({ data: pd });
        await prisma.teamRoster.create({
          data: { team_id: team.id, player_id: player.id, season: '2025', active: true },
        });
      }
    }

    console.log(`  Division "${division.name}": ${teams.length} teams, ${teams.length * 12} players.`);

    // Create standings (empty, will be updated after matches)
    await Promise.all(
      teams.map((t) =>
        prisma.standing.create({
          data: { division_id: division.id, team_id: t.id, rank: 0 },
        })
      )
    );

    // ── Generate round-robin match schedule
    const teamIds = teams.map((t) => t.id);
    const fixtures = roundRobin(teamIds);

    const matchResults: { homeScore: number; awayScore: number }[] = [
      { homeScore: 3, awayScore: 1 },
      { homeScore: 0, awayScore: 0 },
      { homeScore: 2, awayScore: 2 },
      { homeScore: 1, awayScore: 0 },
      { homeScore: 4, awayScore: 2 },
    ];

    for (let i = 0; i < fixtures.length; i++) {
      const [homeId, awayId] = fixtures[i];
      const isCompleted = i < 5;
      const venueId = venues[i % venues.length].id;
      const refereeId = referees[i % referees.length].id;
      const scheduledStart = days(isCompleted ? -(5 - i) : i - 4);

      const result = isCompleted ? matchResults[i] : null;

      const match = await prisma.match.create({
        data: {
          tournament_id: tournament.id,
          division_id: division.id,
          home_team_id: homeId,
          away_team_id: awayId,
          venue_id: venueId,
          scheduled_start: scheduledStart,
          status: isCompleted ? 'COMPLETED' : i === 5 ? 'LIVE' : 'SCHEDULED',
          round: Math.floor(i / 2) + 1,
          home_score: result?.homeScore ?? (i === 5 ? 1 : 0),
          away_score: result?.awayScore ?? (i === 5 ? 0 : 0),
        },
      });

      // Assign referee
      await prisma.matchReferee.create({
        data: { match_id: match.id, referee_id: refereeId, role: 'MAIN' },
      });

      // Add events for completed matches
      if (isCompleted && result) {
        const homeTeam = teams.find((t) => t.id === homeId)!;
        const awayTeam = teams.find((t) => t.id === awayId)!;

        // Add goal events
        for (let g = 0; g < result.homeScore; g++) {
          await prisma.matchEvent.create({
            data: {
              match_id: match.id,
              team_id: homeTeam.id,
              type: 'GOAL',
              minute: 15 + g * 18,
            },
          });
        }
        for (let g = 0; g < result.awayScore; g++) {
          await prisma.matchEvent.create({
            data: {
              match_id: match.id,
              team_id: awayTeam.id,
              type: 'GOAL',
              minute: 22 + g * 20,
            },
          });
        }

        // Add a yellow card
        await prisma.matchEvent.create({
          data: {
            match_id: match.id,
            team_id: homeTeam.id,
            type: 'YELLOW_CARD',
            minute: 38,
          },
        });
      }
    }

    // ── Recalculate standings from completed matches
    const completedMatches = await prisma.match.findMany({
      where: { division_id: division.id, status: 'COMPLETED' },
    });

    const statsMap = new Map<string, { played: number; wins: number; draws: number; losses: number; goals_for: number; goals_against: number; points: number }>();
    const init = () => ({ played: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, points: 0 });

    for (const m of completedMatches) {
      if (!statsMap.has(m.home_team_id)) statsMap.set(m.home_team_id, init());
      if (!statsMap.has(m.away_team_id)) statsMap.set(m.away_team_id, init());
      const home = statsMap.get(m.home_team_id)!;
      const away = statsMap.get(m.away_team_id)!;
      home.played++; away.played++;
      home.goals_for += m.home_score; home.goals_against += m.away_score;
      away.goals_for += m.away_score; away.goals_against += m.home_score;
      if (m.home_score > m.away_score) { home.wins++; home.points += 3; away.losses++; }
      else if (m.home_score < m.away_score) { away.wins++; away.points += 3; home.losses++; }
      else { home.draws++; away.draws++; home.points++; away.points++; }
    }

    const sorted = Array.from(statsMap.entries()).sort(([, a], [, b]) =>
      b.points - a.points || (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against)
    );

    for (const [team_id, stats] of sorted) {
      await prisma.standing.updateMany({
        where: { division_id: division.id, team_id },
        data: { ...stats, goal_difference: stats.goals_for - stats.goals_against, rank: sorted.findIndex(([id]) => id === team_id) + 1 },
      });
    }

    // ── PlayerStats (top scorers from goal events)
    const goalEvents = await prisma.matchEvent.findMany({
      where: { match: { division_id: division.id }, type: 'GOAL' },
      include: { match: true },
    });

    const teamGoals = new Map<string, number>();
    for (const ev of goalEvents) {
      teamGoals.set(ev.team_id, (teamGoals.get(ev.team_id) ?? 0) + 1);
    }

    // Create a lead scorer stat per team
    for (const team of teams) {
      const roster = await prisma.teamRoster.findFirst({ where: { team_id: team.id }, include: { player: true } });
      if (!roster) continue;
      const goals = teamGoals.get(team.id) ?? 0;
      await prisma.playerStat.upsert({
        where: { player_id_tournament_id_division_id: { player_id: roster.player_id, tournament_id: tournament.id, division_id: division.id } },
        create: {
          player_id: roster.player_id,
          tournament_id: tournament.id,
          division_id: division.id,
          team_id: team.id,
          goals,
          assists: Math.floor(goals / 2),
          yellow_cards: 1,
          matches_played: 3,
        },
        update: { goals, assists: Math.floor(goals / 2) },
      });
    }

    console.log(`  Seeded ${fixtures.length} matches and standings for "${division.name}".`);
  }

  // ── Coaches and portal users (linked after teams/players/referees exist)
  const firstTeam = await prisma.team.findFirst({ include: { division: true } });
  const firstPlayer = await prisma.player.findFirst();
  const firstReferee = await prisma.referee.findFirst();

  const coachUser = await prisma.user.create({
    data: {
      first_name: 'Alex',
      last_name: 'Thompson',
      email: 'coach@bctigers.ca',
      password_hash: await bcrypt.hash('demo1234', 12),
      role: 'COACH',
    },
  });

  const coach = await prisma.coach.create({
    data: {
      first_name: 'Alex',
      last_name: 'Thompson',
      email: 'coach@bctigers.ca',
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
      first_name: firstPlayer?.first_name ?? 'James',
      last_name: firstPlayer?.last_name ?? 'Martinez',
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
        user_id: adminUser.id,
        tournament_id: tournament.id,
        title: 'Summer Classic is live',
        message: 'Live scoring and standings are active for all divisions.',
        type: 'INFO',
      },
      {
        user_id: coachUser.id,
        tournament_id: tournament.id,
        title: 'Upcoming match reminder',
        message: 'Check your team schedule for this week\'s fixtures.',
        type: 'INFO',
      },
    ],
  });

  console.log('  Created portal users: coach@bctigers.ca, referee@bctigers.ca, player@bctigers.ca / demo1234');

  console.log('\nSeed complete.');
  console.log('  Admin login: admin@bctigers.ca / Admin1234!');
  console.log('  Portal logins: coach@bctigers.ca, referee@bctigers.ca, player@bctigers.ca, viewer@bctigers.ca / demo1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
