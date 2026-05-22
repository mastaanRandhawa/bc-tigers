import { Injectable, NotFoundException } from '@nestjs/common';
import type { MatchStatus, Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

@Injectable()
export class TournamentsService {
  findAll(params?: { status?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 20, status } = params ?? {};
    return prisma.tournament.findMany({
      where: status
        ? { status: status as Prisma.EnumTournamentStatusFilter }
        : undefined,
      include: { divisions: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { start_date: 'desc' },
    });
  }

  async findOne(slug: string) {
    const t = await prisma.tournament.findUnique({
      where: { slug },
      include: {
        divisions: {
          select: {
            id: true,
            name: true,
            slug: true,
            age_group: true,
            gender: true,
            format: true,
            primary_color: true,
            accent_color: true,
            _count: { select: { teams: true } },
          },
        },
      },
    });
    if (!t) throw new NotFoundException('Tournament not found');
    return t;
  }

  async getOverview(slug: string) {
    const tournament = await this.findOne(slug);
    const divisionIds = tournament.divisions.map((d) => d.id);

    const [matches, topScorers, standingsPreview] = await Promise.all([
      prisma.match.findMany({
        where: { tournament_id: tournament.id },
        include: {
          home_team: true,
          away_team: true,
          division: { include: { tournament: true } },
          venue: true,
        },
        orderBy: { scheduled_start: 'asc' },
        take: 40,
      }),
      prisma.playerStat.findMany({
        where: { tournament_id: tournament.id },
        include: { player: true, team: true, division: true },
        orderBy: { goals: 'desc' },
        take: 5,
      }),
      divisionIds.length
        ? prisma.standing.findMany({
            where: { division_id: divisionIds[0] },
            include: { team: true },
            orderBy: [
              { points: 'desc' },
              { goal_difference: 'desc' },
              { goals_for: 'desc' },
              { fair_play: 'desc' },
            ],
            take: 3,
          })
        : Promise.resolve([]),
    ]);

    const liveMatches = matches.filter((m) => m.status === ('LIVE' as MatchStatus));
    const recentMatches = matches
      .filter((m) => m.status === 'COMPLETED')
      .slice(-4)
      .reverse();
    const upcomingMatches = matches.filter((m) => m.status === 'SCHEDULED').slice(0, 4);

    return {
      tournament,
      liveMatches,
      recentMatches,
      upcomingMatches,
      topScorers,
      standingsPreview,
    };
  }

  async findById(id: string) {
    const t = await prisma.tournament.findUnique({
      where: { id },
      include: {
        divisions: {
          select: {
            id: true,
            name: true,
            slug: true,
            age_group: true,
            gender: true,
            format: true,
            primary_color: true,
            accent_color: true,
            _count: { select: { teams: true, matches: true } },
          },
        },
      },
    });
    if (!t) throw new NotFoundException('Tournament not found');
    return t;
  }

  create(data: Prisma.TournamentCreateInput) {
    return prisma.tournament.create({ data });
  }

  async update(id: string, data: Prisma.TournamentUpdateInput) {
    await prisma.tournament.findUniqueOrThrow({ where: { id } });
    return prisma.tournament.update({ where: { id }, data });
  }

  async remove(id: string) {
    await prisma.tournament.findUniqueOrThrow({ where: { id } });
    return prisma.tournament.delete({ where: { id } });
  }

  getAdmins(tournamentId: string) {
    return prisma.tournamentAdmin.findMany({
      where: { tournament_id: tournamentId },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true, email: true, role: true },
        },
      },
    });
  }

  async assignAdmin(tournamentId: string, userId: string, role = 'ADMIN') {
    await prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } });
    return prisma.tournamentAdmin.upsert({
      where: { tournament_id_user_id: { tournament_id: tournamentId, user_id: userId } },
      create: { tournament_id: tournamentId, user_id: userId, role },
      update: { role },
    });
  }

  async revokeAdmin(tournamentId: string, tournamentAdminId: string) {
    return prisma.tournamentAdmin.delete({ where: { id: tournamentAdminId } });
  }
}
