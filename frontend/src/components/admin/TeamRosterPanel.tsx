import { useState } from 'react';
import { useTeamRoster, useAddToRoster, useRemoveFromRoster, useUpdateRoster } from '@/hooks/useRosters';
import QueryState from '@/components/shared/QueryState';
import { Button } from '@/components/ui/button';
import PlayerFormDialog from '@/components/admin/forms/PlayerFormDialog';
import { getApiErrorMessage } from '@/lib/errors';
import { Pencil, UserPlus } from 'lucide-react';
import type { Player, Team, TeamRoster } from '@/types';

interface TeamRosterPanelProps {
  team: Team;
}

export default function TeamRosterPanel({ team }: TeamRosterPanelProps) {
  const { data: roster = [], isLoading, refetch } = useTeamRoster(team.id);
  const addMutation = useAddToRoster();
  const removeMutation = useRemoveFromRoster();
  const updateMutation = useUpdateRoster();
  const [newPlayerOpen, setNewPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const handleRemove = async (rosterId: string) => {
    if (!confirm('Remove from roster?')) return;
    try {
      await removeMutation.mutateAsync({ teamId: team.id, rosterId });
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to remove'));
    }
  };

  const toggleActive = async (rosterId: string, active: boolean) => {
    try {
      await updateMutation.mutateAsync({ teamId: team.id, rosterId, data: { active: !active } });
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to update'));
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Roster — {team.name}</h3>

      <div className="mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setNewPlayerOpen(true)}
          className="gap-1.5"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Create player
        </Button>
      </div>

      <QueryState isLoading={isLoading} isEmpty={roster.length === 0} emptyMessage="No players on roster yet">
        <ul className="divide-y divide-border">
          {roster.map((entry: TeamRoster) => (
            <li key={entry.id} className="flex items-center justify-between py-2 text-sm">
              <span className={entry.active ? 'text-foreground' : 'text-muted-foreground line-through'}>
                {entry.player?.first_name} {entry.player?.last_name}
                {entry.player?.jersey_number != null && (
                  <span className="ml-1 text-muted-foreground">#{entry.player.jersey_number}</span>
                )}
                {entry.player?.preferred_position && (
                  <span className="ml-2 text-[11px] text-muted-foreground/70">{entry.player.preferred_position}</span>
                )}
              </span>
              <div className="flex gap-1.5">
                {entry.player && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 px-2"
                    onClick={() => setEditingPlayer(entry.player as Player)}
                    title="Edit player details"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => toggleActive(entry.id, entry.active)}>
                  {entry.active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleRemove(entry.id)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </QueryState>

      {/* Create new player — auto-adds to roster on success */}
      <PlayerFormDialog
        open={newPlayerOpen}
        onOpenChange={setNewPlayerOpen}
        onSuccess={async (created) => {
          try {
            await addMutation.mutateAsync({
              teamId: team.id,
              data: { player_id: created.id, season: new Date().getFullYear().toString() },
            });
          } catch {
            // silently ignore — player was still created
          }
        }}
      />

      {/* Edit existing player */}
      <PlayerFormDialog
        open={!!editingPlayer}
        onOpenChange={(open) => { if (!open) setEditingPlayer(null); }}
        player={editingPlayer}
      />

      <button type="button" className="sr-only" onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
