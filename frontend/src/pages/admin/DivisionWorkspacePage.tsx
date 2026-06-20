import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import TeamFormDialog from '@/components/admin/forms/TeamFormDialog';
import TeamRosterPanel from '@/components/admin/TeamRosterPanel';
import MatchFormDialog from '@/components/admin/forms/MatchFormDialog';
import MatchScoreFormDialog from '@/components/admin/forms/MatchScoreFormDialog';
import MatchEventFormDialog from '@/components/admin/forms/MatchEventFormDialog';
import DivisionFormDialog from '@/components/admin/forms/DivisionFormDialog';
import { ScheduleGeneratorSheet } from '@/components/admin/ScheduleGeneratorSheet';
import { BracketCanvas } from '@/components/admin/BracketCanvas';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import AdminStatGrid from '@/components/admin/AdminStatGrid';
import { useDivisions } from '@/hooks/useDivisions';
import { useTeams, useDeleteTeam } from '@/hooks/useTeams';
import { useMatches, useDeleteMatch, useUpdateMatch } from '@/hooks/useMatches';
import { useFormDialog } from '@/hooks/useFormDialog';
import { getDivisionTheme } from '@/lib/division-theme';
import { formatDate, formatTime } from '@/lib/utils';
import { matchSearchText } from '@/lib/search-text';
import { getApiErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from '@/components/ui/sheet';
import { Calendar, GitBranch, Pencil, Shield, Users, Zap, PlusCircle, BarChart3 } from 'lucide-react';
import type { Match, Team } from '@/types';

const MATCH_STATUS_OPTIONS = [
  'SCHEDULED', 'LIVE', 'HALFTIME', 'COMPLETED', 'DELAYED', 'POSTPONED', 'CANCELLED',
] as const;

export default function DivisionWorkspacePage() {
  const { id: tournamentId, divisionId } = useParams<{ id: string; divisionId: string }>();

  const { data: divisions = [], isLoading: divisionsLoading, isError, refetch } = useDivisions();
  const division = divisions.find((d) => d.id === divisionId);

  const { data: teams = [] } = useTeams(divisionId ? { divisionId } : undefined);
  const { data: matches = [] } = useMatches(divisionId ? { divisionId } : undefined);

  const deleteTeamMutation = useDeleteTeam();
  const deleteMatchMutation = useDeleteMatch();
  const updateMatchMutation = useUpdateMatch();

  const teamDialog = useFormDialog<Team>();
  const matchDialog = useFormDialog<Match>();
  const [editDivisionOpen, setEditDivisionOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);
  const [eventMatch, setEventMatch] = useState<Match | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'team' | 'match'; id: string; label: string } | null>(null);

  const theme = division ? getDivisionTheme(division) : null;
  const liveMatches = matches.filter((m) => m.status === 'LIVE');

  const handleStatusChange = async (match: Match, status: string) => {
    try {
      await updateMatchMutation.mutateAsync({ id: match.id, data: { status: status as Match['status'] } });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update status'));
    }
  };

  const teamColumns = [
    {
      key: 'name',
      label: 'Team',
      render: (t: Team) => (
        <div className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
            style={{ backgroundColor: t.primary_color ?? '#F48735' }}
          >
            {t.name[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.city ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roster',
      label: 'Roster',
      render: (t: Team) => (
        <Button variant="outline" size="sm" onClick={() => setRosterTeam(t)}>
          <Users className="h-3.5 w-3.5 mr-1" />
          Manage
        </Button>
      ),
    },
  ];

  const matchColumns = [
    {
      key: 'teams',
      label: 'Match',
      render: (m: Match) => (
        <div>
          <p className="text-sm font-semibold text-foreground">
            {m.home_team?.name ?? 'TBD'} vs {m.away_team?.name ?? 'TBD'}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(m.scheduled_start)} · {formatTime(m.scheduled_start)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (m: Match) => (
        <select
          value={m.status}
          onChange={(e) => handleStatusChange(m, e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          onClick={(e) => e.stopPropagation()}
        >
          {MATCH_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'score',
      label: 'Score',
      render: (m: Match) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setScoreMatch(m); }}
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors min-w-[40px]"
            title="Click to update score"
          >
            {m.status !== 'SCHEDULED' ? `${m.home_score}–${m.away_score}` : '—'}
          </button>
          <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setScoreMatch(m); }}>
            <Zap className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setEventMatch(m); }}>
            <PlusCircle className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    { key: 'round', label: 'Rnd', render: (m: Match) => <span className="text-xs">{m.round ?? '—'}</span> },
  ];

  return (
    <AdminLayout
      title={division?.name ?? 'Division Workspace'}
      description={division ? `${division.format} · ${division.age_group ?? ''} ${division.gender}` : ''}
      action={
        division && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditDivisionOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        )
      }
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 min-w-0 overflow-hidden">
        <Link to="/admin/tournaments" className="hover:text-foreground transition-colors shrink-0">
          Tournaments
        </Link>
        <span className="shrink-0">/</span>
        <Link
          to={`/admin/tournaments/${tournamentId}`}
          className="hover:text-foreground transition-colors truncate min-w-0 max-w-[120px] sm:max-w-none"
        >
          {division?.tournament?.name ?? 'Tournament'}
        </Link>
        <span className="shrink-0">/</span>
        <span className="text-foreground font-medium truncate min-w-0">{division?.name ?? 'Division'}</span>
      </nav>

      <QueryState
        isLoading={divisionsLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!division}
        emptyMessage="Division not found."
      >
        {division && (
          <>
            <AdminStatGrid
              className="mb-5"
              items={[
                { value: teams.length, label: 'Teams', icon: Users },
                { value: matches.length, label: 'Matches', icon: Calendar },
                { value: liveMatches.length, label: 'Live', icon: Zap, accent: liveMatches.length > 0 },
                { value: `${division.points_win}/${division.points_draw}/${division.points_loss}`, label: 'W/D/L pts', icon: BarChart3 },
              ]}
            />

            {/* Division color accent */}
            {theme && (
              <div
                className="mb-4 h-1 w-20 rounded-full"
                style={{ backgroundColor: theme.primary }}
              />
            )}

            <Tabs defaultValue="teams">
              {/* Scrollable tab list on mobile */}
              <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-5">
                <TabsList className="w-max sm:w-auto">
                  <TabsTrigger value="teams">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    Teams
                  </TabsTrigger>
                  <TabsTrigger value="matches">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    Matches
                  </TabsTrigger>
                  <TabsTrigger value="schedule">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger value="bracket">
                    <GitBranch className="h-3.5 w-3.5 mr-1.5" />
                    Bracket
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TEAMS TAB */}
              <TabsContent value="teams">
                <div className="mb-4 flex justify-end">
                  <Button onClick={() => teamDialog.openCreate()} className="w-full sm:w-auto">
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    Add Team
                  </Button>
                </div>
                <AdminTable
                  title=""
                  data={teams}
                  columns={teamColumns}
                  onEdit={teamDialog.openEdit}
                  onDelete={(t) => setDeleteTarget({ type: 'team', id: t.id, label: t.name })}
                  searchKeys={['name', 'city']}
                />
              </TabsContent>

              {/* MATCHES TAB */}
              <TabsContent value="matches">
                <div className="mb-4 flex justify-end">
                  <Button onClick={() => matchDialog.openCreate()} className="w-full sm:w-auto">
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    Add Match
                  </Button>
                </div>
                <AdminTable
                  title=""
                  data={matches}
                  columns={matchColumns}
                  onEdit={matchDialog.openEdit}
                  onDelete={(m) => setDeleteTarget({ type: 'match', id: m.id, label: `${m.home_team?.name} vs ${m.away_team?.name}` })}
                  getSearchText={matchSearchText}
                  searchPlaceholder="Search teams, venue…"
                />
              </TabsContent>

              {/* SCHEDULE TAB */}
              <TabsContent value="schedule">
                <div className="max-w-lg space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-foreground mb-1">Schedule Generator</h2>
                    <p className="text-sm text-muted-foreground">
                      Auto-generate a round-robin schedule for all {teams.length} team
                      {teams.length !== 1 ? 's' : ''} in this division.
                    </p>
                  </div>

                  {teams.length < 2 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Add at least 2 teams before generating a schedule.
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setScheduleOpen(true)}
                      className="gap-2 w-full sm:w-auto"
                    >
                      <Calendar className="h-4 w-4" />
                      Configure & Generate
                    </Button>
                  )}

                  {matches.length > 0 && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Current Schedule
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {matches.length} match{matches.length !== 1 ? 'es' : ''} scheduled across{' '}
                        {new Set(matches.map((m) => m.round).filter(Boolean)).size} rounds.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* BRACKET TAB */}
              <TabsContent value="bracket">
                <BracketCanvas
                  divisionId={division.id}
                  divisionSlug={division.slug}
                  teams={teams}
                  adminBracketLocked={division.bracket_locked ?? false}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </QueryState>

      {/* Overlays */}
      <TeamFormDialog
        open={teamDialog.open}
        onOpenChange={(open) => (open ? teamDialog.setOpen(true) : teamDialog.close())}
        team={teamDialog.editing}
        defaultDivisionId={divisionId}
      />
      <MatchFormDialog
        open={matchDialog.open}
        onOpenChange={(open) => (open ? matchDialog.setOpen(true) : matchDialog.close())}
        match={matchDialog.editing}
        defaultDivisionId={divisionId}
      />
      <MatchScoreFormDialog
        open={!!scoreMatch}
        onOpenChange={(open) => !open && setScoreMatch(null)}
        match={scoreMatch}
      />
      <MatchEventFormDialog
        open={!!eventMatch}
        onOpenChange={(open) => !open && setEventMatch(null)}
        match={eventMatch}
      />
      {division && (
        <DivisionFormDialog
          open={editDivisionOpen}
          onOpenChange={setEditDivisionOpen}
          division={division}
        />
      )}
      <ScheduleGeneratorSheet
        division={division ?? null}
        existingMatchCount={matches.length}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onSuccess={(created) => {
          setScheduleOpen(false);
          toast.success(`Created ${created} matches.`);
        }}
      />

      {/* Roster drawer */}
      <Sheet open={!!rosterTeam} onOpenChange={(open) => !open && setRosterTeam(null)}>
        <SheetContent side="right" className="w-full max-w-md gap-0 p-0">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="truncate">
              Roster — {rosterTeam?.name ?? ''}
            </SheetTitle>
          </SheetHeader>
          <SheetBody className="px-5 py-4">
            {rosterTeam && <TeamRosterPanel team={rosterTeam} />}
          </SheetBody>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.type ?? ''}?`}
        description={`"${deleteTarget?.label}" will be permanently deleted.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'team') await deleteTeamMutation.mutateAsync(deleteTarget.id);
          else await deleteMatchMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </AdminLayout>
  );
}
