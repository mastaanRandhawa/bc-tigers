import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import SearchableTeamPicker from '@/components/admin/SearchableTeamPicker';
import {
  useAssignCoachTeam,
  useUnassignCoachTeam,
  useApproveTeamRequest,
  useRejectTeamRequest,
} from '@/hooks/useUsers';
import { teamsService } from '@/services/teams.service';
import { getApiErrorMessage } from '@/lib/errors';
import type { User } from '@/types';
import { toast } from 'sonner';

interface CoachTeamsSectionProps {
  user: User;
}

export default function CoachTeamsSection({ user }: CoachTeamsSectionProps) {
  const [addTeamId, setAddTeamId] = useState('');
  const assignMutation = useAssignCoachTeam();
  const unassignMutation = useUnassignCoachTeam();
  const approveMutation = useApproveTeamRequest();
  const rejectMutation = useRejectTeamRequest();

  const { data: directory = [] } = useQuery({
    queryKey: ['team-directory'],
    queryFn: async () => (await teamsService.directory()).data,
    staleTime: 5 * 60 * 1000,
  });

  const assignedIds = useMemo(
    () => new Set((user.coached_teams ?? []).map((t) => t.id)),
    [user.coached_teams],
  );

  const addableTeams = useMemo(() => directory.filter((t) => !assignedIds.has(t.id)), [
    directory,
    assignedIds,
  ]);

  const pendingRequests = user.team_requests ?? [];

  if (user.role !== 'COACH') return null;

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <h4 className="text-sm font-semibold text-foreground">Assigned teams</h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Each team has one coach. This coach may manage multiple teams.
        </p>
      </div>

      {(user.coached_teams ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No teams assigned yet.</p>
      ) : (
        <ul className="space-y-2">
          {(user.coached_teams ?? []).map((team) => (
            <li
              key={team.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{team.name}</p>
                {team.division && (
                  <p className="text-xs text-muted-foreground">{team.division.name}</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={unassignMutation.isPending}
                onClick={async () => {
                  try {
                    await unassignMutation.mutateAsync({
                      userId: user.id,
                      teamId: team.id,
                    });
                    toast.success(`Removed from ${team.name}.`);
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, 'Failed to unassign team'));
                  }
                }}
              >
                Unassign
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="assign-team-search">Assign team</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <SearchableTeamPicker
            id="assign-team-search"
            teams={addableTeams}
            value={addTeamId}
            onChange={setAddTeamId}
            searchPlaceholder="Search by team, division, or tournament…"
          />
          <Button
            type="button"
            className="shrink-0 sm:mt-0"
            disabled={!addTeamId || assignMutation.isPending}
            onClick={async () => {
              try {
                await assignMutation.mutateAsync({ userId: user.id, teamId: addTeamId });
                toast.success('Team assigned.');
                setAddTeamId('');
              } catch (err) {
                toast.error(getApiErrorMessage(err, 'Failed to assign team'));
              }
            }}
          >
            Assign
          </Button>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <h4 className="text-sm font-semibold text-foreground">Pending team requests</h4>
          <ul className="space-y-2">
            {pendingRequests.map((req) => (
              <li
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{req.team.name}</p>
                  {req.team.division && (
                    <p className="text-xs text-muted-foreground">{req.team.division.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Pending</Badge>
                  <Button
                    type="button"
                    size="sm"
                    disabled={approveMutation.isPending}
                    onClick={async () => {
                      try {
                        await approveMutation.mutateAsync(req.id);
                        toast.success('Request approved and team assigned.');
                      } catch (err) {
                        toast.error(getApiErrorMessage(err, 'Failed to approve request'));
                      }
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={rejectMutation.isPending}
                    onClick={async () => {
                      try {
                        await rejectMutation.mutateAsync(req.id);
                        toast.success('Request rejected.');
                      } catch (err) {
                        toast.error(getApiErrorMessage(err, 'Failed to reject request'));
                      }
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {user.coaching_request && (
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          Registration note: {user.coaching_request}
        </p>
      )}
    </div>
  );
}
