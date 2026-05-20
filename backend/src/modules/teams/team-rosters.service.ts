import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import prisma from '../../prisma/prisma';

@Injectable()
export class TeamRostersService {
  async findByTeam(teamId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    return prisma.teamRoster.findMany({
      where: { team_id: teamId },
      include: { player: true },
      orderBy: { joined_at: 'desc' },
    });
  }

  async addPlayer(
    teamId: string,
    data: { player_id: string; season?: string; active?: boolean },
  ) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const player = await prisma.player.findUnique({ where: { id: data.player_id } });
    if (!player) throw new NotFoundException('Player not found');

    const season = data.season ?? new Date().getFullYear().toString();
    const existing = await prisma.teamRoster.findFirst({
      where: { team_id: teamId, player_id: data.player_id, season },
    });
    if (existing) throw new ConflictException('Player already on roster for this season');

    return prisma.teamRoster.create({
      data: {
        team_id: teamId,
        player_id: data.player_id,
        season,
        active: data.active ?? true,
      },
      include: { player: true },
    });
  }

  async update(teamId: string, rosterId: string, data: { active?: boolean; season?: string }) {
    const roster = await prisma.teamRoster.findFirst({
      where: { id: rosterId, team_id: teamId },
    });
    if (!roster) throw new NotFoundException('Roster entry not found');

    return prisma.teamRoster.update({
      where: { id: rosterId },
      data,
      include: { player: true },
    });
  }

  async remove(teamId: string, rosterId: string) {
    const roster = await prisma.teamRoster.findFirst({
      where: { id: rosterId, team_id: teamId },
    });
    if (!roster) throw new NotFoundException('Roster entry not found');
    return prisma.teamRoster.delete({ where: { id: rosterId } });
  }
}
