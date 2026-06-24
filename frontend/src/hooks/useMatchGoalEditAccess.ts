import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { isAdminRole, isCoachRole } from '@/lib/auth-utils';
import { useCoachTeamData } from '@/hooks/useCoach';
import type { Match } from '@/types';

export function useMatchGoalEditAccess(match?: Match | null) {
  const { isAuthenticated, user } = useAuthStore();
  const { team: coachTeam } = useCoachTeamData();

  return useMemo(() => {
    const isAdmin = isAuthenticated && isAdminRole(user?.role);
    const isCoach = isAuthenticated && isCoachRole(user?.role);

    const coachTeamId =
      coachTeam && match
        ? match.home_team_id === coachTeam.id
          ? coachTeam.id
          : match.away_team_id === coachTeam.id
            ? coachTeam.id
            : null
        : null;

    const canCoachEditGoals = isCoach && !!coachTeamId;
    const canEditGoals = isAdmin || canCoachEditGoals;
    const canEditAllEvents = isAdmin;

    return {
      isAdmin,
      isCoach,
      coachTeamId,
      canEditGoals,
      canEditAllEvents,
      canEditScore: isAdmin,
    };
  }, [coachTeam, isAuthenticated, match, user?.role]);
}

export function coachCanEditEvent(
  event: { type: string; team_id?: string },
  canEditAllEvents: boolean,
  coachTeamId?: string | null,
): boolean {
  if (canEditAllEvents) return true;
  if (event.type !== 'GOAL') return false;
  if (!coachTeamId) return false;
  return event.team_id === coachTeamId;
}
