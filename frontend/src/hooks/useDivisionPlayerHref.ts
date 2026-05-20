import { useCallback } from 'react';
import { useDivisionRoute } from '@/context/DivisionContext';
import { divisionTeamPlayerPath } from '@/lib/division-routes';
import type { PlayerStat } from '@/types';

/** Build team-scoped player URLs for stats leaderboards and similar lists. */
export function useDivisionPlayerHref() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();

  return useCallback(
    (stat: PlayerStat): string | null => {
      const teamSlug = stat.team?.slug;
      const playerId = stat.player?.id;
      if (!teamSlug || !playerId) return null;
      return divisionTeamPlayerPath(tournamentSlug, divisionSlug, teamSlug, playerId);
    },
    [tournamentSlug, divisionSlug],
  );
}
