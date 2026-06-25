import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionTeam } from '@/hooks/useDivisionResources';
import { matchesPlayerRef } from '@/lib/player-routes';
import { ChevronLeft, User, Pencil } from 'lucide-react';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import { useRosterVisibility } from '@/hooks/useRosterVisibility';
import { useAuthStore } from '@/store/authStore';
import { isCoachRole } from '@/lib/auth-utils';
import { AdminActionButton } from '@/components/admin/inline/AdminActionButton';
import PlayerFormDialog from '@/components/admin/forms/PlayerFormDialog';
import type { Player } from '@/types';

export default function DivisionPlayerDetailPage() {
  const { teamSlug = '', playerId = '' } = useParams();
  const { tournamentSlug, divisionSlug, basePath } = useDivisionRoute();
  const { data: team, isLoading, isError, refetch } = useDivisionTeam(
    tournamentSlug,
    divisionSlug,
    teamSlug,
  );

  const canEdit = useCanAdminEdit();
  const { user } = useAuthStore();
  const { rostersPublic, rostersAvailableAt } = useRosterVisibility();
  const [editOpen, setEditOpen] = useState(false);

  const player = team?.players?.find((p) => matchesPlayerRef(p, playerId));
  const isTeamCoach = isCoachRole(user?.role) && team?.coach?.id === user?.id;
  const rosterUnpublished = !rostersPublic && !canEdit && !isTeamCoach;
  const teamPath = `${basePath}/teams/${teamSlug}`;

  return (
    <>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!player || !team}
        onRetry={() => refetch()}
        emptyMessage={
          rosterUnpublished
            ? rostersAvailableAt
              ? `Rosters will be published on ${new Date(rostersAvailableAt).toLocaleString()}.`
              : 'Rosters are not published yet. Check back after registration closes.'
            : 'Player not found on this team.'
        }
      >
        {player && team && (
          <>
            <Link
              to={teamPath}
              className="division-link mb-4 inline-flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back to {team.name}
            </Link>

            <div className="mb-6 overflow-hidden rounded-xl bg-card shadow-sm border border-border">
              <div
                className="relative px-6 py-8 text-center text-white"
                style={{ backgroundColor: team.primary_color ?? 'var(--division-primary)' }}
              >
                {canEdit && (
                  <div className="absolute right-3 top-3">
                    <AdminActionButton
                      size="xs"
                      onClick={() => setEditOpen(true)}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit player
                    </AdminActionButton>
                  </div>
                )}

                {player.profile_image ? (
                  <img
                    src={player.profile_image}
                    alt=""
                    className="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-white/30 object-cover"
                  />
                ) : (
                  <User className="mx-auto mb-4 h-20 w-20" aria-hidden />
                )}
                <h1 className="text-2xl font-bold tracking-tight font-display">
                  {player.first_name} {player.last_name}
                </h1>
                <p className="mt-1 text-sm text-white/85">
                  #{player.jersey_number ?? '—'} · {player.preferred_position ?? 'Player'}
                </p>
                <p className="mt-2 text-sm text-white/75">{team.name}</p>
              </div>
            </div>

            {canEdit && (
              <PlayerFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                teamId={team.id}
                player={player as Player}
              />
            )}
          </>
        )}
      </QueryState>
    </>
  );
}
