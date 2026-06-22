import { useState } from 'react';
import { useTeamPlayers, useCreateTeamPlayer, useUpdateTeamPlayer, useDeleteTeamPlayer } from '@/hooks/useTeamPlayers';
import QueryState from '@/components/shared/QueryState';
import { Button } from '@/components/ui/button';
import PlayerFormDialog from '@/components/admin/forms/PlayerFormDialog';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/errors';
import { Pencil, UserPlus } from 'lucide-react';
import { Users } from 'lucide-react';
import type { Player, Team } from '@/types';
import { useAdminSettings } from '@/hooks/useSettings';

interface TeamRosterPanelProps {
  team: Team;
}

export default function TeamRosterPanel({ team }: TeamRosterPanelProps) {
  const { data: settings } = useAdminSettings();
  const maxPlayers = settings?.max_players_per_team ?? 25;
  const { data: players = [], isLoading, refetch } = useTeamPlayers(team.id);
  const createMutation = useCreateTeamPlayer();
  const updateMutation = useUpdateTeamPlayer();
  const deleteMutation = useDeleteTeamPlayer();
  const [newPlayerOpen, setNewPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [error, setError] = useState('');

  const atRosterCap = players.length >= maxPlayers;

  const toggleActive = async (player: Player) => {
    try {
      await updateMutation.mutateAsync({
        teamId: team.id,
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
      await deleteMutation.mutateAsync({ teamId: team.id, playerId: deleteTarget.id });
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
            Roster is full. Increase the limit in Site Information or remove a player first.
          </p>
        )}
      </div>

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
              <div className="flex gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 px-2"
                  onClick={() => setEditingPlayer(player)}
                  title="Edit player details"
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
            </li>
          ))}
        </ul>
      </QueryState>

      <PlayerFormDialog
        open={newPlayerOpen}
        onOpenChange={setNewPlayerOpen}
        teamId={team.id}
        onSuccess={() => refetch()}
      />

      <PlayerFormDialog
        open={!!editingPlayer}
        onOpenChange={(open) => { if (!open) setEditingPlayer(null); }}
        teamId={team.id}
        player={editingPlayer}
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
