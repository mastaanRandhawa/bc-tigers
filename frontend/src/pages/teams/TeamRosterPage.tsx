import { useCallback, useMemo, useState } from 'react';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import SectionBlock from '@/components/design-system/SectionBlock';
import SurfaceCard from '@/components/design-system/SurfaceCard';
import RosterCard from '@/components/teams/RosterCard';
import RosterList from '@/components/teams/RosterList';
import CoachTeamBanner from '@/components/teams/CoachTeamBanner';
import { useTeamRoute } from '@/context/TeamContext';
import { useListSearch } from '@/hooks/useListSearch';
import { useDivisionPlayers } from '@/hooks/useDivisionResources';
import { useAuthStore } from '@/store/authStore';
import { canManageTeam } from '@/lib/coach-utils';
import {
  useAddRosterPlayer,
  useRemoveRosterPlayer,
  useUpdateRosterPlayer,
} from '@/hooks/useTeamManagement';
import { playerSearchText } from '@/lib/search-text';
import { playersToRoster } from '@/lib/roster-utils';
import { getApiErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Player, TeamRoster } from '@/types';
import { Trash2, UserPlus } from 'lucide-react';

export default function TeamRosterPage() {
  const { team, tournamentSlug, divisionSlug, teamSlug, theme } = useTeamRoute();
  const user = useAuthStore((s) => s.user);
  const canEdit = canManageTeam(user, team.id);
  const { data: divisionPlayers = [] } = useDivisionPlayers(tournamentSlug, divisionSlug);
  const addMutation = useAddRosterPlayer();
  const removeMutation = useRemoveRosterPlayer();
  const updateMutation = useUpdateRosterPlayer();
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [error, setError] = useState('');

  const rosterEntries = team.rosters ?? [];
  const rosterPlayerIds = new Set(rosterEntries.map((r) => r.player_id));

  const roster = useMemo(
    () => (rosterEntries.map((r) => r.player).filter(Boolean) as Player[]) ?? [],
    [rosterEntries],
  );

  const rosterPlayers = useMemo(() => playersToRoster(roster), [roster]);
  const gradientFrom = team.primary_color ?? theme.primary;
  const gradientTo = team.secondary_color ?? theme.primaryHover ?? '#1a1a1a';

  const availablePlayers = divisionPlayers.filter((p) => !rosterPlayerIds.has(p.id));

  const getPlayerText = useCallback((p: Player) => playerSearchText(p), []);
  const {
    search,
    setSearch,
    filtered,
    debouncedSearch,
    hasQuery,
  } = useListSearch(roster, getPlayerText);

  const handleAdd = async () => {
    if (!selectedPlayerId) return;
    setError('');
    try {
      await addMutation.mutateAsync({
        teamId: team.id,
        playerId: selectedPlayerId,
        tournamentSlug,
        divisionSlug,
        teamSlug,
      });
      setSelectedPlayerId('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to add player'));
    }
  };

  const handleRemove = async (entry: TeamRoster) => {
    if (!confirm('Remove this player from the roster?')) return;
    setError('');
    try {
      await removeMutation.mutateAsync({
        teamId: team.id,
        rosterId: entry.id,
        tournamentSlug,
        divisionSlug,
        teamSlug,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to remove player'));
    }
  };

  const handleToggleActive = async (entry: TeamRoster) => {
    setError('');
    try {
      await updateMutation.mutateAsync({
        teamId: team.id,
        rosterId: entry.id,
        data: { active: !entry.active },
        tournamentSlug,
        divisionSlug,
        teamSlug,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update roster entry'));
    }
  };

  return (
    <div className="space-y-4">
      <CoachTeamBanner teamId={team.id} />

      {roster.length > 0 && (
        <RosterCard
          title="Squad"
          teamName={team.name}
          players={rosterPlayers}
          gradientFrom={gradientFrom}
          gradientTo={gradientTo}
          accentColor="#ffffff"
        />
      )}

      <SectionBlock title="Full roster" subtitle="Tap a player for profile" variant="card">
        {canEdit && (
          <SurfaceCard variant="default" padding="md" className="mb-4 bg-bauhaus-muted/50">
            <p className="m-0 text-sm font-medium text-foreground">Add player to roster</p>
            {error && <p className="m-0 mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="add-player">Player</Label>
                <select
                  id="add-player"
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="">Select a player…</option>
                  {availablePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                      {p.jersey_number != null ? ` (#${p.jersey_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!selectedPlayerId || addMutation.isPending}
              >
                <UserPlus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </SurfaceCard>
        )}

        {canEdit && rosterEntries.length > 0 && (
          <div className="mb-4 space-y-2">
            {rosterEntries.map((entry) => {
              const player = entry.player;
              if (!player) return null;
              return (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm"
                >
                  <span className="font-medium">
                    {player.first_name} {player.last_name}
                    {!entry.active && (
                      <span className="ml-2 text-xs text-foreground/55">(inactive)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(entry)}
                      disabled={updateMutation.isPending}
                    >
                      {entry.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleRemove(entry)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {roster.length > 0 && (
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search players…"
            className="mb-4 max-w-md"
          />
        )}

        {hasQuery && filtered.length === 0 ? (
          <SearchEmpty query={debouncedSearch} entityLabel="players" />
        ) : roster.length > 0 ? (
          <RosterList
            players={filtered}
            tournamentSlug={tournamentSlug}
            divisionSlug={divisionSlug}
            teamSlug={teamSlug}
          />
        ) : (
          <p className="text-meta m-0">No players on the roster yet.</p>
        )}
      </SectionBlock>
    </div>
  );
}
