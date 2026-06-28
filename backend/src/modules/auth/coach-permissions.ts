import { ForbiddenException, NotFoundException } from '@nestjs/common';
import prisma from '../../prisma/prisma';
import { getCoachTeamId, getCoachTeamIds } from '../teams/coach-team-link';
import { getCoachLockSettings, isCoachLockEffective } from './coach-lock';

export { getCoachTeamId, getCoachTeamIds };

export async function assertCoachCanEditTeam(
  userId: string,
  teamId: string,
): Promise<void> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { coach_user_id: true, management_locked: true },
  });
  if (!team) throw new NotFoundException('Team not found');
  if (team.coach_user_id !== userId) {
    throw new ForbiddenException('You can only manage your assigned team');
  }

  const lockSettings = await getCoachLockSettings();
  if (isCoachLockEffective(lockSettings)) {
    throw new ForbiddenException('Coach management is locked system-wide');
  }
  if (team.management_locked) {
    throw new ForbiddenException(
      'Team management is locked by an administrator',
    );
  }
}

export async function isCoachManagementLocked(): Promise<boolean> {
  const settings = await getCoachLockSettings();
  return isCoachLockEffective(settings);
}

export { getCoachLockStatus } from './coach-lock';
