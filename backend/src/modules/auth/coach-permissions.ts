import { ForbiddenException, NotFoundException } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { getCoachTeamId } from '../teams/coach-team-link';

export { getCoachTeamId };

export async function assertCoachCanEditTeam(userId: string, teamId: string): Promise<void> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { coach_user_id: true, management_locked: true },
  });
  if (!team) throw new NotFoundException('Team not found');
  if (team.coach_user_id !== userId) {
    throw new ForbiddenException('You can only manage your assigned team');
  }

  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
    select: { coach_management_locked: true },
  });
  if (settings?.coach_management_locked) {
    throw new ForbiddenException('Coach management is locked system-wide');
  }
  if (team.management_locked) {
    throw new ForbiddenException('Team management is locked by an administrator');
  }
}

export async function isCoachManagementLocked(): Promise<boolean> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
    select: { coach_management_locked: true },
  });
  return settings?.coach_management_locked ?? false;
}
