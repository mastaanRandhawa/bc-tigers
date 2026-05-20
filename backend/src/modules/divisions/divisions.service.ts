import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

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
}
