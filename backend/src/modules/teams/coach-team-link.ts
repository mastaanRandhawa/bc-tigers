import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

type Db = Prisma.TransactionClient | typeof prisma;

/** All teams assigned to a coach (each team has at most one coach). */
export async function getCoachTeamIds(userId: string): Promise<string[]> {
  const teams = await prisma.team.findMany({
    where: { coach_user_id: userId, is_deleted: false },
    select: { id: true },
    orderBy: { name: 'asc' },
  });
  return teams.map((t) => t.id);
}

/**
 * Resolves the coach's active team. When teamId is provided, verifies ownership.
 * Otherwise returns the first assigned team (alphabetical).
 */
export async function getCoachTeamId(
  userId: string,
  teamId?: string | null,
): Promise<string | null> {
  const teamIds = await getCoachTeamIds(userId);
  if (teamIds.length === 0) return null;
  if (teamId) return teamIds.includes(teamId) ? teamId : null;
  return teamIds[0];
}

export async function assertCoachOwnsTeam(
  coachUserId: string,
  teamId: string,
): Promise<void> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { coach_user_id: true },
  });
  if (!team?.coach_user_id || team.coach_user_id !== coachUserId) {
    throw new BadRequestException('Coach is not assigned to this team');
  }
}

export async function validateCoachCanBeAssigned(
  coachUserId: string,
): Promise<void> {
  const coach = await prisma.user.findUnique({
    where: { id: coachUserId },
    select: { role: true },
  });

  if (!coach || coach.role !== 'COACH') {
    throw new BadRequestException('Assigned user must be a coach');
  }
}

/** Assign or unassign a coach on a team (one coach per team; coach may have many teams). */
export async function applyCoachTeamAssignment(
  teamId: string,
  coachUserId: string | null,
  tx: Db = prisma,
): Promise<void> {
  if (coachUserId === null) {
    await tx.team.update({
      where: { id: teamId },
      data: { coach_user_id: null },
    });
    return;
  }

  await validateCoachCanBeAssigned(coachUserId);

  await tx.team.update({
    where: { id: teamId },
    data: { coach_user_id: coachUserId },
  });
}
