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
      include: {
        teams: true,
        standings: { include: { team: true }, orderBy: { rank: 'asc' } },
        matches: { include: { home_team: true, away_team: true } },
      },
    });
    if (!division) throw new NotFoundException('Division not found');
    return division;
  }

  findAll() {
    return prisma.division.findMany({ include: { tournament: true } });
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
