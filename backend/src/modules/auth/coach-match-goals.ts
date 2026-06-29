import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { MatchEvent, MatchEventType, Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { getCoachTeamId } from '../teams/coach-team-link';

const COACH_GOAL_TYPE: MatchEventType = 'GOAL';

export type CoachGoalEventPatch = {
  team_id?: string;
  type?: MatchEventType;
  player_id?: string | null;
};

/** Narrow Prisma update input to plain coach-goal fields for authorization checks. */
export function coachGoalPatchFromUpdate(
  patch: Prisma.MatchEventUncheckedUpdateInput,
): CoachGoalEventPatch {
  return {
    team_id: typeof patch.team_id === 'string' ? patch.team_id : undefined,
    type: typeof patch.type === 'string' ? patch.type : undefined,
    player_id:
      patch.player_id === undefined
        ? undefined
        : patch.player_id === null || typeof patch.player_id === 'string'
          ? patch.player_id
          : undefined,
  };
}

export function isCoachGoalEventType(type: MatchEventType): boolean {
  return type === COACH_GOAL_TYPE;
}

async function loadCoachMatchContext(userId: string, matchId: string) {
  const teamId = await getCoachTeamId(userId);
  if (!teamId) {
    throw new ForbiddenException('No team assigned to your coach account');
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, home_team_id: true, away_team_id: true },
  });
  if (!match) throw new NotFoundException('Match not found');

  const isTeamMatch =
    match.home_team_id === teamId || match.away_team_id === teamId;
  if (!isTeamMatch) {
    throw new ForbiddenException(
      'You can only record goals for your team’s matches',
    );
  }

  return { teamId, match };
}

async function assertPlayerOnTeam(
  playerId: string | null | undefined,
  teamId: string,
): Promise<void> {
  if (!playerId) return;

  const player = await prisma.player.findFirst({
    where: { id: playerId, team_id: teamId, active: true },
    select: { id: true },
  });
  if (!player) {
    throw new BadRequestException('Player must be on the selected team');
  }
}

export async function assertCoachCanAddGoalEvent(
  userId: string,
  matchId: string,
  data: { team_id?: string; type?: MatchEventType; player_id?: string | null },
): Promise<void> {
  const { teamId } = await loadCoachMatchContext(userId, matchId);

  if (data.type && data.type !== COACH_GOAL_TYPE) {
    throw new ForbiddenException('Coaches can only record goal events');
  }
  if (!data.team_id || data.team_id !== teamId) {
    throw new ForbiddenException('Goals must be recorded for your team');
  }

  await assertPlayerOnTeam(data.player_id, teamId);
}

export async function assertCoachCanUpdateGoalEvent(
  userId: string,
  matchId: string,
  existing: Pick<MatchEvent, 'type' | 'team_id'>,
  patch: CoachGoalEventPatch,
): Promise<void> {
  const { teamId } = await loadCoachMatchContext(userId, matchId);

  if (!isCoachGoalEventType(existing.type)) {
    throw new ForbiddenException('Coaches can only edit goal events');
  }
  if (existing.team_id !== teamId) {
    throw new ForbiddenException(
      'You can only edit goals recorded for your team',
    );
  }
  if (patch.type && patch.type !== COACH_GOAL_TYPE) {
    throw new ForbiddenException('Coaches can only record goal events');
  }
  if (patch.team_id && patch.team_id !== teamId) {
    throw new ForbiddenException('Goals must stay assigned to your team');
  }

  await assertPlayerOnTeam(patch.player_id, teamId);
}

export async function assertCoachCanDeleteGoalEvent(
  userId: string,
  matchId: string,
  existing: Pick<MatchEvent, 'type' | 'team_id'>,
): Promise<void> {
  const { teamId } = await loadCoachMatchContext(userId, matchId);

  if (!isCoachGoalEventType(existing.type)) {
    throw new ForbiddenException('Coaches can only delete goal events');
  }
  if (existing.team_id !== teamId) {
    throw new ForbiddenException(
      'You can only delete goals recorded for your team',
    );
  }
}
