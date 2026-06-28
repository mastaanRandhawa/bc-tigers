import { useState } from 'react';
import {
  useCoachPlayers,
  useUpdateCoachPlayer,
  useDeleteCoachPlayer,
} from '@/hooks/useCoach';
import QueryState from '@/components/shared/QueryState';
import { Button } from '@/components/ui/button';
import CoachPlayerFormDialog from '@/components/coach/CoachPlayerFormDialog';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/errors';
import { Pencil, UserPlus, Users } from 'lucide-react';
import type { Player, Team } from '@/types';

interface CoachRosterPanelProps {
  team: Team;
  canEdit: boolean;
  maxPlayers?: number;
}

export default function CoachRosterPanel({ team, canEdit, maxPlayers = 25 }: CoachRosterPanelProps) {
  const { data: players = [], isLoading, refetch } = useCoachPlayers(team.id, !!team.id);
  const updateMutation = useUpdateCoachPlayer(team.id);
  const deleteMutation = useDeleteCoachPlayer(team.id);
  const [newPlayerOpen, setNewPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [error, setError] = useState('');

  const atRosterCap = players.length >= maxPlayers;

  const toggleActive = async (player: Player) => {
    try {
      await updateMutation.mutateAsync({
        playerId: player.id,
        data: { active: !player.active },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update player'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete player'));
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground m-0">Roster — {team.name}</h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {players.length} / {maxPlayers} players
        </span>
      </div>

      {error && (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {canEdit && (
        <div className="mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNewPlayerOpen(true)}
            className="gap-1.5"
            disabled={atRosterCap}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add player
          </Button>
          {atRosterCap && (
            <p className="mt-2 text-xs text-amber-700">
              Roster is full ({maxPlayers} players max). Contact an administrator if you need more slots.
            </p>
          )}
        </div>
      )}

      <QueryState isLoading={isLoading} isEmpty={players.length === 0} emptyMessage="No players on roster yet">
        <ul className="divide-y divide-border">
          {players.map((player) => (
            <li key={player.id} className="flex items-center justify-between py-2 text-sm gap-2">
              <span className={player.active !== false ? 'text-foreground' : 'text-muted-foreground line-through'}>
                {player.first_name} {player.last_name}
                {player.jersey_number != null && (
                  <span className="ml-1 text-muted-foreground">#{player.jersey_number}</span>
                )}
                {player.preferred_position && (
                  <span className="ml-2 text-[11px] text-muted-foreground/70">{player.preferred_position}</span>
                )}
              </span>
              {canEdit && (
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 px-2"
                    onClick={() => setEditingPlayer(player)}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(player)}>
                    {player.active !== false ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => setDeleteTarget(player)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </QueryState>

      <CoachPlayerFormDialog
        open={newPlayerOpen}
        onOpenChange={setNewPlayerOpen}
        teamId={team.id}
        onSuccess={() => refetch()}
      />

      <CoachPlayerFormDialog
        open={!!editingPlayer}
        onOpenChange={(open) => { if (!open) setEditingPlayer(null); }}
        player={editingPlayer}
        teamId={team.id}
        onSuccess={() => refetch()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Remove player?"
        description={
          deleteTarget
            ? `Remove ${deleteTarget.first_name} ${deleteTarget.last_name} from ${team.name}?`
            : ''
        }
        confirmLabel="Remove"
        onConfirm={handleDelete}
      />
    </div>
  );
}
