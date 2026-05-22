import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { roundRobinPairs } from '../../common/round-robin';

@Injectable()
export class DivisionsService {
  async findByTournament(tournamentSlug: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { slug: tournamentSlug },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');
    return prisma.division.findMany({
      where: { tournament_id: tournament.id },
      include: { teams: true },
    });
  }

  async findOne(tournamentSlug: string, divisionSlug: string) {
    return this.resolveDivision(tournamentSlug, divisionSlug, {
      tournament: true,
      teams: true,
      standings: { include: { team: true }, orderBy: { rank: 'asc' } },
      matches: { include: { home_team: true, away_team: true } },
    });
  }

  async resolveDivision(
    tournamentSlug: string,
    divisionSlug: string,
    include?: Parameters<typeof prisma.division.findUnique>[0]['include'],
  ) {
    const tournament = await prisma.tournament.findUnique({
      where: { slug: tournamentSlug },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');
    const division = await prisma.division.findUnique({
      where: {
        tournament_id_slug: {
          tournament_id: tournament.id,
          slug: divisionSlug,
        },
      },
      include: include ?? { tournament: true },
    });
    if (!division) throw new NotFoundException('Division not found');
    return division;
  }

  findAll() {
    return prisma.division.findMany({ include: { tournament: true } });
  }

  async findBySlugGlobal(divisionSlug: string) {
    const divisions = await prisma.division.findMany({
      where: { slug: divisionSlug },
      include: { tournament: true },
    });
    if (divisions.length === 0) throw new NotFoundException('Division not found');
    if (divisions.length > 1) {
      return divisions;
    }
    return divisions[0];
  }

  create(data: Prisma.DivisionCreateInput) {
    return prisma.division.create({ data });
  }

  update(id: string, data: Prisma.DivisionUpdateInput) {
    return prisma.division.update({ where: { id }, data });
  }

  remove(id: string) {
    return prisma.division.delete({ where: { id } });
  }

  async generateSchedule(
    divisionId: string,
    options?: {
      startDate?: string;
      matchIntervalMinutes?: number;
      venueId?: string;
      fieldId?: string;
      force?: boolean;
    },
  ) {
    const division = await prisma.division.findUnique({
      where: { id: divisionId },
      include: { teams: true, tournament: true },
    });
    if (!division) throw new NotFoundException('Division not found');

    const existingCount = await prisma.match.count({
      where: { division_id: divisionId },
    });
    if (existingCount > 0 && !options?.force) {
      throw new BadRequestException(
        'Division already has matches. Pass force=true to replace.',
      );
    }

    if (options?.force && existingCount > 0) {
      await prisma.match.deleteMany({ where: { division_id: divisionId } });
    }

    const teamIds = division.teams.map((t) => t.id);
    if (teamIds.length < 2) {
      throw new BadRequestException('At least 2 teams required to generate a schedule');
    }

    const pairs = roundRobinPairs(teamIds);
    const intervalMs = (options?.matchIntervalMinutes ?? 90) * 60 * 1000;
    const start = options?.startDate
      ? new Date(options.startDate)
      : new Date(division.tournament.start_date);

    const matches = await prisma.$transaction(
      pairs.map(([homeId, awayId], index) => {
        const scheduled_start = new Date(start.getTime() + index * intervalMs);
        return prisma.match.create({
          data: {
            tournament_id: division.tournament_id,
            division_id: divisionId,
            home_team_id: homeId,
            away_team_id: awayId,
            venue_id: options?.venueId ?? null,
            field_id: options?.fieldId ?? null,
            scheduled_start,
            status: 'SCHEDULED',
            round: Math.floor(index / Math.max(1, teamIds.length - 1)) + 1,
          },
        });
      }),
    );

    return { created: matches.length, matches };
  }
}
