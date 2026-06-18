import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import AdminStatGrid from '@/components/admin/AdminStatGrid';
import QueryState from '@/components/shared/QueryState';
import DivisionFormDialog from '@/components/admin/forms/DivisionFormDialog';
import MatchFormDialog from '@/components/admin/forms/MatchFormDialog';
import MatchScoreFormDialog from '@/components/admin/forms/MatchScoreFormDialog';
import MatchEventFormDialog from '@/components/admin/forms/MatchEventFormDialog';
import TeamFormDialog from '@/components/admin/forms/TeamFormDialog';
import TeamRosterPanel from '@/components/admin/TeamRosterPanel';
import TournamentFormDialog from '@/components/admin/forms/TournamentFormDialog';
import { ScheduleGeneratorSheet } from '@/components/admin/ScheduleGeneratorSheet';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTournamentById } from '@/hooks/useTournaments';
import { useDivisions, useDeleteDivision } from '@/hooks/useDivisions';
import { useTeams, useDeleteTeam } from '@/hooks/useTeams';
import { useMatches, useDeleteMatch } from '@/hooks/useMatches';
import { useFormDialog } from '@/hooks/useFormDialog';
import { getDivisionTheme, themeChipStyle } from '@/lib/division-theme';
import { formatDate, formatTime, getMatchStatusBadgeVariant } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { matchSearchText } from '@/lib/search-text';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from '@/components/ui/sheet';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Pencil,
  Trash2,
  Users,
  Zap,
  PlusCircle,
  Flag,
  Layers,
} from 'lucide-react';
import type { Division, Match, Team } from '@/types';

export default function TournamentWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { data: tournament, isLoading, isError, refetch } = useTournamentById(id);
  const { data: divisions = [] } = useDivisions();
  const { data: allTeams = [] } = useTeams();
  const { data: matches = [] } = useMatches({ tournamentId: id });

  const deleteDivisionMutation = useDeleteDivision();
  const deleteTeamMutation = useDeleteTeam();
  const deleteMatchMutation = useDeleteMatch();

  const divisionDialog = useFormDialog<Division>();
  const teamDialog = useFormDialog<Team>();
  const matchDialog = useFormDialog<Match>();
  const [editTournament, setEditTournament] = useState(false);
  const [scheduleDiv, setScheduleDiv] = useState<Division | null>(null);
  const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);
  const [eventMatch, setEventMatch] = useState<Match | null>(null);
  const [deleteId, setDeleteId] = useState<{ type: 'division' | 'team' | 'match'; id: string; label: string } | null>(null);

  const tournamentDivisions = divisions.filter((d) => d.tournament_id === id);
  const divisionIds = new Set(tournamentDivisions.map((d) => d.id));
  const tournamentTeams = allTeams.filter((t) => divisionIds.has(t.division_id));
  const liveMatches = matches.filter((m) => m.status === 'LIVE');

  if (!id) return null;

  const teamColumns = [
    {
      key: 'name',
      label: 'Team',
      render: (t: Team) => (
        <div className="flex items-center gap-3">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
            style={{ backgroundColor: t.primary_color ?? '#F48735' }}
          >
            {t.name[0]}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.division?.name ?? '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'city', label: 'City', render: (t: Team) => <span className="text-sm">{t.city ?? '—'}</span> },
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
          <p className="font-semibold text-foreground text-sm">
            {m.home_team?.name ?? 'TBD'} vs {m.away_team?.name ?? 'TBD'}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(m.scheduled_start)} · {formatTime(m.scheduled_start)}
          </p>
          <p className="text-xs text-muted-foreground">{m.division?.name}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (m: Match) => (
        <Badge variant={getMatchStatusBadgeVariant(m.status)}>{m.status}</Badge>
      ),
    },
    {
      key: 'score',
      label: 'Score',
      render: (m: Match) => (
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm">
            {m.status !== 'SCHEDULED' ? `${m.home_score} – ${m.away_score}` : '–'}
          </span>
          <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setScoreMatch(m); }}>
            <Zap className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setEventMatch(m); }}>
            <PlusCircle className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title={tournament?.name ?? 'Tournament Workspace'}
      description={tournament ? `${tournament.location} · ${formatDate(tournament.start_date)} – ${formatDate(tournament.end_date)}` : ''}
      action={
        tournament && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditTournament(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </div>
        )
      }
    >
      <Link
        to="/admin/tournaments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Tournaments
      </Link>

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        {tournament && (
          <>
            <AdminStatGrid
              className="mb-6"
              items={[
                { value: tournamentDivisions.length, label: 'Divisions', icon: Layers },
                { value: tournamentTeams.length, label: 'Teams', icon: Users },
                { value: matches.length, label: 'Matches', icon: Calendar },
                { value: liveMatches.length, label: 'Live', icon: Zap, accent: liveMatches.length > 0 },
              ]}
            />

            <Tabs defaultValue="divisions">
              {/* Scrollable tab list on mobile */}
              <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-5">
                <TabsList className="w-max sm:w-auto">
                  <TabsTrigger value="divisions">
                    <Flag className="h-3.5 w-3.5 mr-1.5" />
                    Divisions
                  </TabsTrigger>
                  <TabsTrigger value="teams">
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    Teams
                  </TabsTrigger>
                  <TabsTrigger value="matches">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    Matches
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* DIVISIONS TAB */}
              <TabsContent value="divisions">
                <div className="mb-4 flex justify-end">
                  <Button onClick={() => divisionDialog.openCreate()} className="w-full sm:w-auto">
                    Add Division
                  </Button>
                </div>

                {tournamentDivisions.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
                    <Flag className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No divisions yet. Add one to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {tournamentDivisions.map((division) => {
                      const theme = getDivisionTheme(division);
                      const teamCount = tournamentTeams.filter((t) => t.division_id === division.id).length;
                      const matchCount = matches.filter((m) => m.division_id === division.id).length;

                      return (
                        <div key={division.id} className="admin-card p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                              style={themeChipStyle(theme)}
                            >
                              <Flag className="h-5 w-5" style={{ color: theme.primary }} aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-base" style={{ color: theme.primary }}>
                                {division.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {teamCount} teams · {matchCount} matches · {division.format}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                            <Link
                              to={`/admin/tournaments/${id}/divisions/${division.id}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open Workspace
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setScheduleDiv(division)}
                              disabled={teamCount < 2}
                              title={teamCount < 2 ? 'Need at least 2 teams' : 'Generate schedule'}
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Schedule
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => divisionDialog.openEdit(division)}>
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={() =>
                                setDeleteId({ type: 'division', id: division.id, label: division.name })
                              }
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* TEAMS TAB */}
              <TabsContent value="teams">
                <div className="mb-4 flex justify-end">
                  <Button onClick={() => teamDialog.openCreate()} className="w-full sm:w-auto">
                    Add Team
                  </Button>
                </div>
                <AdminTable
                  title=""
                  data={tournamentTeams}
                  columns={teamColumns}
                  onEdit={teamDialog.openEdit}
                  onDelete={(t) => setDeleteId({ type: 'team', id: t.id, label: t.name })}
                  searchKeys={['name', 'city']}
                />
              </TabsContent>

              {/* MATCHES TAB */}
              <TabsContent value="matches">
                <div className="mb-4 flex justify-end">
                  <Button onClick={() => matchDialog.openCreate()} className="w-full sm:w-auto">
                    Add Match
                  </Button>
                </div>
                <AdminTable
                  title=""
                  data={matches}
                  columns={matchColumns}
                  onEdit={matchDialog.openEdit}
                  onDelete={(m) => setDeleteId({ type: 'match', id: m.id, label: `${m.home_team?.name ?? 'TBD'} vs ${m.away_team?.name ?? 'TBD'}` })}
                  getSearchText={matchSearchText}
                  searchPlaceholder="Search teams, venue…"
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </QueryState>

      {/* Overlays */}
      <DivisionFormDialog
        open={divisionDialog.open}
        onOpenChange={(open) => (open ? divisionDialog.setOpen(true) : divisionDialog.close())}
        division={divisionDialog.editing}
      />
      <TeamFormDialog
        open={teamDialog.open}
        onOpenChange={(open) => (open ? teamDialog.setOpen(true) : teamDialog.close())}
        team={teamDialog.editing}
      />
      <MatchFormDialog
        open={matchDialog.open}
        onOpenChange={(open) => (open ? matchDialog.setOpen(true) : matchDialog.close())}
        match={matchDialog.editing}
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
      <TournamentFormDialog
        open={editTournament}
        onOpenChange={setEditTournament}
        tournament={tournament}
      />
      <ScheduleGeneratorSheet
        division={scheduleDiv}
        existingMatchCount={scheduleDiv ? matches.filter((m) => m.division_id === scheduleDiv.id).length : 0}
        open={!!scheduleDiv}
        onOpenChange={(open) => !open && setScheduleDiv(null)}
        onSuccess={(created) => toast.success(`Created ${created} matches.`)}
      />
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
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={`Delete ${deleteId?.type ?? ''}?`}
        description={`"${deleteId?.label}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteId) return;
          if (deleteId.type === 'division') await deleteDivisionMutation.mutateAsync(deleteId.id);
          else if (deleteId.type === 'team') await deleteTeamMutation.mutateAsync(deleteId.id);
          else if (deleteId.type === 'match') await deleteMatchMutation.mutateAsync(deleteId.id);
          setDeleteId(null);
        }}
      />
    </AdminLayout>
  );
}
