import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Resolves a coach's team only when both sides of the relation agree:
 * Team.coach_user_id → User and User.coached_team → Team.
 */
export async function getCoachTeamId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      coached_team: {
        select: { id: true, coach_user_id: true },
      },
    },
  });

  const team = user?.coached_team;
  if (!team || team.coach_user_id !== userId) return null;
  return team.id;
}

export async function assertBidirectionalCoachTeamLink(
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

  const coach = await prisma.user.findUnique({
    where: { id: coachUserId },
    select: { coached_team: { select: { id: true } } },
  });
  if (coach?.coached_team?.id !== teamId) {
    throw new BadRequestException('Coach and team references do not match');
  }
}

export async function validateCoachCanBeAssigned(
  coachUserId: string,
  teamId?: string | null,
): Promise<void> {
  const coach = await prisma.user.findUnique({
    where: { id: coachUserId },
    select: {
      role: true,
      coached_team: { select: { id: true, name: true } },
    },
  });

  if (!coach || coach.role !== 'COACH') {
    throw new BadRequestException('Assigned user must be a coach');
  }

  if (coach.coached_team && coach.coached_team.id !== teamId) {
    throw new BadRequestException(
      `Coach is already assigned to ${coach.coached_team.name}. Unassign them first.`,
    );
  }
}

/** One coach per team: clear this coach from any other team before assigning. */
export async function clearCoachFromOtherTeams(
  coachUserId: string,
  exceptTeamId?: string | null,
  tx: Db = prisma,
): Promise<void> {
  await tx.team.updateMany({
    where: {
      coach_user_id: coachUserId,
      ...(exceptTeamId ? { NOT: { id: exceptTeamId } } : {}),
    },
    data: { coach_user_id: null },
  });
}

/**
 * Assign or unassign a coach on a team, keeping the 1:1 link consistent on both sides.
 */
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

  await validateCoachCanBeAssigned(coachUserId, teamId);
  await clearCoachFromOtherTeams(coachUserId, teamId, tx);

  await tx.team.update({
    where: { id: teamId },
    data: { coach_user_id: coachUserId },
  });

  await assertBidirectionalCoachTeamLink(coachUserId, teamId);
}
