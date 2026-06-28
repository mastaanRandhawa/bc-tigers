import { getRequestContext } from '../../common/request-context';
import { getCoachLockStatus } from './coach-lock';

export type RequestActor = {
  userId: string;
  role: string;
};

export function getRequestActor(): RequestActor | undefined {
  const req = getRequestContext()?.req as
    | { user?: { userId?: string; role?: string } }
    | undefined;
  if (!req?.user?.userId) return undefined;
  return { userId: req.user.userId, role: req.user.role ?? '' };
}

export function isAdminRole(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

export async function areRostersPublic(): Promise<boolean> {
  const status = await getCoachLockStatus();
  return status.coach_management_locked;
}

export function canViewTeamRoster(
  actor: RequestActor | undefined,
  teamCoachUserId: string | null | undefined,
  rostersPublic: boolean,
): boolean {
  if (rostersPublic) return true;
  if (!actor) return false;
  if (isAdminRole(actor.role)) return true;
  if (
    actor.role === 'COACH' &&
    teamCoachUserId &&
    actor.userId === teamCoachUserId
  ) {
    return true;
  }
  return false;
}

export async function getRosterVisibilityContext() {
  const rostersPublic = await areRostersPublic();
  const actor = getRequestActor();
  return { rostersPublic, actor };
}

export function stripTeamPlayers<T extends object>(
  team: T,
  canView: boolean,
): T {
  if (canView) return team;
  return { ...team, players: [] };
}
