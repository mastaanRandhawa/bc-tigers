import { Navigate, useParams } from 'react-router-dom';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionPlayers } from '@/hooks/useDivisionResources';
import { matchesPlayerRef } from '@/lib/player-routes';

/** Legacy `/players` and `/players/:idOrSlug` routes → teams or team roster player. */
export function DivisionPlayersListRedirect() {
  const { basePath } = useDivisionRoute();
  return <Navigate to={`${basePath}/teams`} replace />;
}

export function DivisionPlayerLegacyRedirect() {
  const { playerId = '' } = useParams();
  const { tournamentSlug, divisionSlug, basePath } = useDivisionRoute();
  const { data: players = [], isLoading } = useDivisionPlayers(tournamentSlug, divisionSlug);

  if (isLoading) return null;

  const player = players.find((p) => matchesPlayerRef(p, playerId));
  const teamSlug = player?.team?.slug;

  if (teamSlug && player) {
    return (
      <Navigate to={`${basePath}/teams/${teamSlug}/players/${player.id}`} replace />
    );
  }

  return <Navigate to={`${basePath}/teams`} replace />;
}
