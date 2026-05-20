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
        rosters: { include: { player: true } },
      },
    });
  }

  async findOne(slug: string) {
    const team = await prisma.team.findFirst({
      where: { slug },
      include: {
        division: { include: { tournament: true } },
        rosters: { include: { player: true } },
        team_coaches: { include: { coach: true } },
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
