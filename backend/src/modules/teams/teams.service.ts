import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

@Injectable()
export class TeamsService {
  findAll(params?: { divisionId?: string }) {
    return prisma.team.findMany({
      where: params?.divisionId
        ? { division_id: params.divisionId }
        : undefined,
      include: {
        division: { include: { tournament: true } },
        players: { where: { active: true }, orderBy: { last_name: 'asc' } },
      },
    });
  }

  async findOneInDivision(divisionId: string, slug: string) {
    const team = await prisma.team.findUnique({
      where: {
        division_id_slug: { division_id: divisionId, slug },
      },
      include: {
        division: { include: { tournament: true } },
        players: { orderBy: { last_name: 'asc' } },
        standings: true,
      },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  create(data: unknown) {
    return prisma.team.create({ data: data as Prisma.TeamCreateInput });
  }

  update(id: string, data: unknown) {
    return prisma.team.update({
      where: { id },
      data: data as Prisma.TeamUpdateInput,
    });
  }

  remove(id: string) {
    return prisma.team.delete({ where: { id } });
  }
}
