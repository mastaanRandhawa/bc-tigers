import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import {
  ensureUniquePlayerSlug,
  playerLookupWhere,
  slugifyPlayerName,
} from '../../common/player-slug';

type PlayerWriteInput = {
  first_name?: string;
  last_name?: string;
  slug?: string;
  [key: string]: unknown;
};

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

  findByDivision(divisionId: string) {
    return prisma.player.findMany({
      where: {
        rosters: { some: { team: { division_id: divisionId } } },
      },
      include: {
        rosters: {
          where: { team: { division_id: divisionId } },
          include: { team: true },
        },
        player_stats: {
          where: { division_id: divisionId },
          include: { tournament: true, team: true },
        },
      },
      orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
    });
  }

  async findOne(idOrSlug: string) {
    const player = await prisma.player.findUnique({
      where: playerLookupWhere(idOrSlug),
      include: {
        rosters: { include: { team: true } },
        player_stats: { include: { tournament: true } },
      },
    });
    if (!player) throw new NotFoundException('Player not found');
    return player;
  }

  async findOneOnTeam(teamId: string, playerId: string) {
    const player = await prisma.player.findFirst({
      where: {
        ...playerLookupWhere(playerId),
        rosters: { some: { team_id: teamId, active: true } },
      },
      include: {
        rosters: {
          where: { team_id: teamId },
          include: { team: { include: { division: { include: { tournament: true } } } } },
        },
        player_stats: { include: { tournament: true, division: true, team: true } },
        match_events: {
          where: { team_id: teamId },
          include: { match: true },
          orderBy: { created_at: 'desc' },
          take: 20,
        },
      },
    });
    if (!player) throw new NotFoundException('Player not found on this team');
    return player;
  }

  async create(data: unknown) {
    const input = data as PlayerWriteInput;
    const first_name = String(input.first_name ?? '').trim();
    const last_name = String(input.last_name ?? '').trim();
    if (!first_name || !last_name) {
      throw new BadRequestException('First and last name are required');
    }

    const { slug: _ignored, ...rest } = input;
    const base = slugifyPlayerName(first_name, last_name);
    const slug = await ensureUniquePlayerSlug(prisma, base);

    return prisma.player.create({
      data: {
        ...(rest as Prisma.PlayerCreateInput),
        first_name,
        last_name,
        slug,
      },
    });
  }

  async update(id: string, data: unknown) {
    const input = data as PlayerWriteInput;
    const { slug: _ignored, ...rest } = input;
    return prisma.player.update({
      where: { id },
      data: rest as Prisma.PlayerUpdateInput,
    });
  }

  remove(id: string) {
    return prisma.player.delete({ where: { id } });
  }
}
