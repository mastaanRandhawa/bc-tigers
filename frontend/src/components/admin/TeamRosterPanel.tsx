import { useState } from 'react';
import { useTeamRoster, useAddToRoster, useRemoveFromRoster, useUpdateRoster } from '@/hooks/useRosters';
import { usePlayers } from '@/hooks/usePlayers';
import QueryState from '@/components/shared/QueryState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/errors';
import type { Team } from '@/types';

interface TeamRosterPanelProps {
  team: Team;
}

export default function TeamRosterPanel({ team }: TeamRosterPanelProps) {
  const { data: roster = [], isLoading, refetch } = useTeamRoster(team.id);
  const { data: players = [] } = usePlayers();
  const addMutation = useAddToRoster();
  const removeMutation = useRemoveFromRoster();
  const updateMutation = useUpdateRoster();
  const [playerId, setPlayerId] = useState('');

  const rosterPlayerIds = new Set(roster.map((r) => r.player_id));
  const available = players.filter((p) => !rosterPlayerIds.has(p.id));

  const handleAdd = async () => {
    if (!playerId) return;
    try {
      await addMutation.mutateAsync({
        teamId: team.id,
        data: { player_id: playerId, season: new Date().getFullYear().toString() },
      });
      setPlayerId('');
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to add player'));
    }
  };

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
      <h3 className="text-sm font-semibold text-foreground mb-3">Roster — {team.name}</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={playerId} onValueChange={setPlayerId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Add player…" />
          </SelectTrigger>
          <SelectContent>
            {available.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleAdd} disabled={!playerId || addMutation.isPending}>
          Add to roster
        </Button>
      </div>
      <QueryState isLoading={isLoading} isEmpty={roster.length === 0} emptyMessage="No players on roster">
        <ul className="divide-y divide-border">
          {roster.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-2 text-sm">
              <span className={entry.active ? 'text-foreground' : 'text-muted-foreground line-through'}>
                {entry.player?.first_name} {entry.player?.last_name}
                {entry.player?.jersey_number != null && (
                  <span className="ml-1 text-muted-foreground">#{entry.player.jersey_number}</span>
                )}
              </span>
              <div className="flex gap-2">
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
      <button type="button" className="sr-only" onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
