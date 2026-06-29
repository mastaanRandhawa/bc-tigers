import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { pickAllowed } from '../../common/pick';

/** Up to four team officials (manager, physio, etc.) may be attached per team. */
export const MAX_OFFICIALS_PER_TEAM = 4;

const OFFICIAL_FIELDS = ['name', 'role', 'order'] as const;

@Injectable()
export class TeamOfficialsService {
  async findByTeam(teamId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    return prisma.teamOfficial.findMany({
      where: { team_id: teamId },
      orderBy: [{ order: 'asc' }, { created_at: 'asc' }],
    });
  }

  async create(teamId: string, data: unknown) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const count = await prisma.teamOfficial.count({
      where: { team_id: teamId },
    });
    if (count >= MAX_OFFICIALS_PER_TEAM) {
      throw new BadRequestException(
        `A team can have at most ${MAX_OFFICIALS_PER_TEAM} officials.`,
      );
    }

    const payload = pickAllowed<Prisma.TeamOfficialUncheckedCreateInput>(
      data,
      OFFICIAL_FIELDS,
    );
    const name = String(payload.name ?? '').trim();
    const role = String(payload.role ?? '').trim();
    if (!name || !role) {
      throw new BadRequestException('Name and role are required.');
    }

    return prisma.teamOfficial.create({
      data: {
        team_id: teamId,
        name,
        role,
        order: typeof payload.order === 'number' ? payload.order : count,
      },
    });
  }

  async update(teamId: string, officialId: string, data: unknown) {
    const official = await prisma.teamOfficial.findFirst({
      where: { id: officialId, team_id: teamId },
    });
    if (!official)
      throw new NotFoundException('Official not found on this team');

    const patch = pickAllowed<Prisma.TeamOfficialUncheckedUpdateInput>(
      data,
      OFFICIAL_FIELDS,
    );
    return prisma.teamOfficial.update({
      where: { id: officialId },
      data: patch,
    });
  }

  async remove(teamId: string, officialId: string) {
    const official = await prisma.teamOfficial.findFirst({
      where: { id: officialId, team_id: teamId },
    });
    if (!official)
      throw new NotFoundException('Official not found on this team');
    return prisma.teamOfficial.delete({ where: { id: officialId } });
  }
}
