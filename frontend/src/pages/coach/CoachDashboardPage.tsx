import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CoachRosterPanel from '@/components/coach/CoachRosterPanel';
import CoachMatchesPanel from '@/components/coach/CoachMatchesPanel';
import { useAuthStore } from '@/store/authStore';
import {
  useCoachTeamData,
  useCoachTeamRequests,
  useSelectedCoachTeamId,
  useUpdateCoachTeam,
} from '@/hooks/useCoach';
import { teamsService } from '@/services/teams.service';
import { getApiErrorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/utils';
import { Lock, LogOut, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function CoachDashboardPage() {
  const { user, logout } = useAuthStore();
  const { data: teamRequests = [], createRequest, refetch: refetchRequests } =
    useCoachTeamRequests();
  const [requestTeamId, setRequestTeamId] = useState('');

  const bootstrapQuery = useCoachTeamData();
  const teamIds = bootstrapQuery.data?.team_ids ?? [];
  const { selectedTeamId, selectTeam } = useSelectedCoachTeamId(teamIds);

  const { team, coachData, isLoading, isError, refetch } =
    useCoachTeamData(selectedTeamId);
  const updateTeam = useUpdateCoachTeam(selectedTeamId);

  const { data: directory = [] } = useQuery({
    queryKey: ['team-directory'],
    queryFn: async () => (await teamsService.directory()).data,
    staleTime: 5 * 60 * 1000,
  });

  const pendingRequests = useMemo(
    () => teamRequests.filter((r) => r.status === 'PENDING'),
    [teamRequests],
  );

  const requestableTeams = useMemo(() => {
    const blocked = new Set([
      ...teamIds,
      ...pendingRequests.map((r) => r.team.id),
    ]);
    return directory.filter((t) => !blocked.has(t.id));
  }, [directory, teamIds, pendingRequests]);

  const [form, setForm] = useState({
    city: '',
    logo: '',
    primary_color: '#F48735',
    secondary_color: '#F48735',
    contact_email: '',
    contact_phone: '',
  });

  const locked =
    coachData?.coach_management_locked ||
    team?.management_locked;
  const scheduledPending = coachData?.coach_lock_scheduled_pending;
  const scheduledAt = coachData?.coach_lock_scheduled_at;
  const canEdit = team?.can_edit ?? false;

  useEffect(() => {
    if (!team) return;
    setForm({
      city: team.city ?? '',
      logo: team.logo ?? '',
      primary_color: team.primary_color ?? '#F48735',
      secondary_color: team.secondary_color ?? '#F48735',
      contact_email: team.contact_email ?? '',
      contact_phone: team.contact_phone ?? '',
    });
  }, [team]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateTeam.mutateAsync({
        city: form.city || undefined,
        logo: form.logo || undefined,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        contact_email: form.contact_email || undefined,
        contact_phone: form.contact_phone || undefined,
      });
      toast.success('Team updated.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update team'));
    }
  };

  const handleRequestTeam = async () => {
    if (!requestTeamId) return;
    try {
      await createRequest.mutateAsync(requestTeamId);
      toast.success('Team request submitted.');
      setRequestTeamId('');
      void refetchRequests();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to submit team request'));
    }
  };

  const showTeamManagement = !!team;
  const showEmptyAssigned = !isLoading && !team && teamIds.length === 0;

  return (
    <PageLayout>
      <section className="py-10 px-4 bg-muted min-h-[70vh]">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Coach Portal</h1>
              <p className="text-muted-foreground mt-1">
                {user?.first_name} {user?.last_name} · {user?.email}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/profile">Profile</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" /> Sign out
              </Button>
            </div>
          </div>

          {teamIds.length > 1 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
              <Label htmlFor="coach-team-select">Active team</Label>
              <select
                id="coach-team-select"
                value={selectedTeamId ?? ''}
                onChange={(e) => selectTeam(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/80 bg-card px-3 text-sm"
              >
                {(coachData?.teams ?? bootstrapQuery.data?.teams ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.division ? ` · ${t.division.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scheduledPending && scheduledAt && !locked && (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <Lock className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                Team management will be locked system-wide on{' '}
                <strong>{formatDateTime(scheduledAt)}</strong>.
              </p>
            </div>
          )}

          {locked && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <Lock className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Team management is locked</p>
                <p className="mt-1 text-amber-800/90">
                  {coachData?.coach_lock_scheduled_active && !coachData?.coach_lock_manual
                    ? 'A scheduled global coach lock is now in effect.'
                    : coachData?.coach_management_locked
                      ? 'An administrator has locked all coach edits system-wide.'
                      : 'An administrator has locked edits for your team.'}
                  {' '}Contact an administrator to make changes.
                </p>
              </div>
            </div>
          )}

          <QueryState
            isLoading={isLoading || bootstrapQuery.isLoading}
            isError={isError || bootstrapQuery.isError}
            onRetry={() => {
              void refetch();
              void bootstrapQuery.refetch();
            }}
          >
            {showEmptyAssigned && (
              <div className="rounded-xl border border-border bg-card p-6 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  No team has been assigned to your coach account yet.
                </p>
                {pendingRequests.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground">Pending requests</p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {pendingRequests.map((r) => (
                        <li key={r.id}>
                          {r.team.name}
                          {r.team.division ? ` · ${r.team.division.name}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {showTeamManagement && team && (
              <>
                <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-foreground">{team.name}</h2>
                    {team.division && (
                      <Badge variant="secondary">{team.division.name}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Team name and division are managed by administrators.
                    {team.coach_user_id && user?.id === team.coach_user_id && (
                      <span className="block mt-1 text-green-700">
                        You are the assigned coach for this team.
                      </span>
                    )}
                  </p>
                </div>

                <form
                  onSubmit={handleSave}
                  className="rounded-xl border border-border bg-card p-6 space-y-4"
                >
                  <h3 className="font-semibold text-foreground">Team details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>City</Label>
                      <Input
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Logo URL</Label>
                      <Input
                        value={form.logo}
                        onChange={(e) => setForm({ ...form, logo: e.target.value })}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contact email</Label>
                      <Input
                        type="email"
                        value={form.contact_email}
                        onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contact phone</Label>
                      <Input
                        value={form.contact_phone}
                        onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Primary color</Label>
                      <Input
                        type="color"
                        value={form.primary_color}
                        onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Secondary color</Label>
                      <Input
                        type="color"
                        value={form.secondary_color}
                        onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                  {canEdit && (
                    <Button type="submit" disabled={updateTeam.isPending}>
                      <Save className="w-4 h-4" />
                      {updateTeam.isPending ? 'Saving...' : 'Save team details'}
                    </Button>
                  )}
                </form>

                <CoachMatchesPanel team={team} />

                <CoachRosterPanel
                  team={team}
                  canEdit={canEdit}
                  maxPlayers={coachData?.max_players_per_team ?? team.max_players_per_team ?? 25}
                />
              </>
            )}
          </QueryState>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground">Request another team</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Submit a request for an unassigned team. An administrator must approve it before you can manage the roster.
              </p>
            </div>
            {pendingRequests.length > 0 && (
              <ul className="text-sm space-y-1 text-muted-foreground">
                {pendingRequests.map((r) => (
                  <li key={r.id}>
                    Pending: {r.team.name}
                    {r.team.division ? ` · ${r.team.division.name}` : ''}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <select
                value={requestTeamId}
                onChange={(e) => setRequestTeamId(e.target.value)}
                className="h-10 min-w-[12rem] flex-1 rounded-xl border border-border/80 bg-card px-3 text-sm"
              >
                <option value="">Select a team…</option>
                {requestableTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.division.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                disabled={!requestTeamId || createRequest.isPending}
                onClick={handleRequestTeam}
              >
                {createRequest.isPending ? 'Submitting…' : 'Request team'}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
