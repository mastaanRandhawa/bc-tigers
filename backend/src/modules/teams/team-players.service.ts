import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import {
  ensureUniquePlayerSlug,
  playerLookupWhere,
  slugifyPlayerName,
} from '../../common/player-slug';
import { getMaxPlayersPerTeam } from '../settings/settings.service';

type PlayerWriteInput = {
  first_name?: string;
  last_name?: string;
  slug?: string;
  active?: boolean;
  [key: string]: unknown;
};

@Injectable()
export class TeamPlayersService {
  async assertRosterCapacity(teamId: string) {
    const [count, max] = await Promise.all([
      prisma.player.count({ where: { team_id: teamId } }),
      getMaxPlayersPerTeam(),
    ]);
    if (count >= max) {
      throw new BadRequestException(
        `Team roster is full (maximum ${max} players per team).`,
      );
    }
  }

  async findByTeam(teamId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    return prisma.player.findMany({
      where: { team_id: teamId },
      orderBy: [{ active: 'desc' }, { last_name: 'asc' }, { first_name: 'asc' }],
    });
  }

  findByDivision(divisionId: string) {
    return prisma.player.findMany({
      where: { team: { division_id: divisionId } },
      include: { team: true },
      orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
    });
  }

  async findOneOnTeam(teamId: string, playerId: string) {
    const player = await prisma.player.findFirst({
      where: {
        team_id: teamId,
        ...playerLookupWhere(playerId, teamId),
      },
      include: {
        team: { include: { division: { include: { tournament: true } } } },
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

  async create(teamId: string, data: unknown) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const input = data as PlayerWriteInput;
    const first_name = String(input.first_name ?? '').trim();
    const last_name = String(input.last_name ?? '').trim();
    if (!first_name || !last_name) {
      throw new BadRequestException('First and last name are required');
    }

    await this.assertRosterCapacity(teamId);

    const base = slugifyPlayerName(first_name, last_name);
    const slug = await ensureUniquePlayerSlug(prisma, teamId, base);

    return prisma.player.create({
      data: {
        first_name,
        last_name,
        slug,
        team_id: teamId,
        active: input.active ?? true,
        jersey_number: input.jersey_number as number | undefined,
        preferred_position: input.preferred_position as string | undefined,
        profile_image: input.profile_image as string | undefined,
        dob: input.dob ? new Date(String(input.dob)) : undefined,
      },
    });
  }

  async update(teamId: string, playerId: string, data: unknown) {
    const player = await prisma.player.findFirst({
      where: { team_id: teamId, id: playerId },
    });
    if (!player) throw new NotFoundException('Player not found on this team');

    const input = data as PlayerWriteInput;
    const { slug: _ignored, ...rest } = input;
    return prisma.player.update({
      where: { id: playerId },
      data: rest as Prisma.PlayerUpdateInput,
    });
  }

  async remove(teamId: string, playerId: string) {
    const player = await prisma.player.findFirst({
      where: { team_id: teamId, id: playerId },
    });
    if (!player) throw new NotFoundException('Player not found on this team');
    return prisma.player.delete({ where: { id: playerId } });
  }
}
