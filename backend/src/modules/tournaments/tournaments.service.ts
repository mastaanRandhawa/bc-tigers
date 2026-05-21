import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
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
          include: {
            teams: { select: { id: true } },
            _count: { select: { matches: true } },
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
}
