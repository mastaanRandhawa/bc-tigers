import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

@Injectable()
export class PlayersService {
  findAll(params?: { teamId?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params ?? {};
    return prisma.player.findMany({
      where: params?.teamId
        ? { rosters: { some: { team_id: params.teamId } } }
        : undefined,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { last_name: 'asc' },
    });
  }

  async findOne(slug: string) {
    const player = await prisma.player.findUnique({
      where: { slug },
      include: {
        rosters: { include: { team: true } },
        player_stats: { include: { tournament: true } },
      },
    });
    if (!player) throw new NotFoundException('Player not found');
    return player;
  }

  create(data: unknown) {
    return prisma.player.create({ data: data as Prisma.PlayerCreateInput });
  }

  update(id: string, data: unknown) {
    return prisma.player.update({
      where: { id },
      data: data as Prisma.PlayerUpdateInput,
    });
  }

  remove(id: string) {
    return prisma.player.delete({ where: { id } });
  }
}
