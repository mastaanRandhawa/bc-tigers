import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { divisionSearchText } from '@/lib/search-text';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import DivisionDirectoryCard from '@/components/shared/DivisionDirectoryCard';
import { useTournamentOverview } from '@/hooks/useTournaments';
import { Trophy, Calendar, MapPin, Flag, Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import { AdminContextBar } from '@/components/admin/inline/AdminContextBar';
import { AdminActionButton } from '@/components/admin/inline/AdminActionButton';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import DivisionFormDialog from '@/components/admin/forms/DivisionFormDialog';
import TournamentFormDialog from '@/components/admin/forms/TournamentFormDialog';
import { useDeleteDivision } from '@/hooks/useDivisions';
import { useFormDialog } from '@/hooks/useFormDialog';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/errors';
import type { Division, Tournament } from '@/types';

export default function TournamentDetailPage() {
  const { tournamentSlug } = useParams();
  const { data: overview, isLoading, isError, refetch } = useTournamentOverview(tournamentSlug);
  const tournament = overview?.tournament;
  const divisions = tournament?.divisions ?? [];
  const canEdit = useCanAdminEdit();

  const getDivisionText = useCallback(
    (d: (typeof divisions)[0]) => divisionSearchText(d),
    [],
  );
  const {
    search: divisionSearch,
    setSearch: setDivisionSearch,
    filtered: filteredDivisions,
    debouncedSearch: debouncedDivisionSearch,
    hasQuery: hasDivisionQuery,
  } = useListSearch(divisions, getDivisionText);

  const divisionDialog = useFormDialog<Division>();
  const tournamentDialog = useFormDialog<Tournament>();
  const deleteMutation = useDeleteDivision();
  const [deleteTarget, setDeleteTarget] = useState<Division | null>(null);

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      isEmpty={!tournament}
      onRetry={() => refetch()}
      emptyMessage="Tournament not found."
    >
      {tournament && (
        <>
          {/* ── Hero band ─────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden border-b border-border bg-card py-7 sm:py-10">
            <div className="pointer-events-none absolute inset-0 bg-brand-grid opacity-40" />
            <div className="relative z-10 page-container">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  {tournament.logo ? (
                    <img src={tournament.logo} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Trophy className="h-6 w-6 text-primary" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Badge
                    variant={tournament.status === 'ACTIVE' ? 'success' : 'default'}
                    className="mb-2 rounded-md"
                  >
                    {tournament.status}
                  </Badge>
                  <h1 className="text-page-title m-0">{tournament.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
                    </span>
                    {tournament.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {tournament.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Flag className="h-3.5 w-3.5" aria-hidden />
                      {tournament.tournament_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                {canEdit && (
                  <AdminActionButton
                    size="xs"
                    onClick={() => tournamentDialog.openEdit(tournament as Tournament)}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit tournament
                  </AdminActionButton>
                )}
              </div>
            </div>
          </div>

          {/* ── Body ──────────────────────────────────────────────────────────── */}
          <PageContent>
            {/* Admin bar — context label + link to bulk admin only, no duplicate Add button */}
            <AdminContextBar
              label="Editing tournament"
              advancedHref="/admin/divisions"
              advancedLabel="All divisions"
            />

            {/* One unified card that groups About + Divisions */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">

              {/* About */}
              {tournament.description && (
                <div className="px-5 py-5">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    About
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {tournament.description}
                  </p>
                </div>
              )}

              {tournament.description && (
                <div className="border-t border-border/60" />
              )}

              {/* Divisions header row — single Add action lives here */}
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Divisions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {divisions.length} {divisions.length === 1 ? 'division' : 'divisions'} in this tournament
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <AdminActionButton onClick={divisionDialog.openCreate} size="xs">
                      <Plus className="h-3 w-3" />
                      Add division
                    </AdminActionButton>
                  )}
                  {divisions.length > 3 && (
                    <SearchField
                      value={divisionSearch}
                      onChange={setDivisionSearch}
                      placeholder="Search divisions…"
                      className="w-48 sm:w-64"
                      aria-label="Search divisions"
                    />
                  )}
                </div>
              </div>

              {/* Divisions list */}
              {hasDivisionQuery && filteredDivisions.length === 0 ? (
                <div className="border-t border-border/60 px-5 py-8">
                  <SearchEmpty query={debouncedDivisionSearch} entityLabel="divisions" />
                </div>
              ) : (
                <div className="divide-y divide-border/60 border-t border-border/60">
                  {filteredDivisions.map((div) => {
                    const divisionWithTournament = { ...div, tournament };
                    return (
                      <div key={div.id} className="group relative flex items-center">
                        <div className="min-w-0 flex-1">
                          <DivisionDirectoryCard
                            variant="row"
                            division={divisionWithTournament}
                          />
                        </div>
                        {canEdit && (
                          <div className="mr-3 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <AdminActionButton
                              size="xs"
                              variant="ghost"
                              onClick={() => divisionDialog.openEdit(divisionWithTournament as Division)}
                              aria-label={`Edit ${div.name}`}
                            >
                              <Pencil className="h-3 w-3" />
                            </AdminActionButton>
                            <AdminActionButton
                              size="xs"
                              variant="destructive"
                              onClick={() => setDeleteTarget(divisionWithTournament as Division)}
                              aria-label={`Delete ${div.name}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </AdminActionButton>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </PageContent>

          {/* Dialogs */}
          <DivisionFormDialog
            open={divisionDialog.open}
            onOpenChange={divisionDialog.setOpen}
            division={divisionDialog.editing}
          />
          <TournamentFormDialog
            open={tournamentDialog.open}
            onOpenChange={(open) => (open ? tournamentDialog.setOpen(true) : tournamentDialog.close())}
            tournament={tournamentDialog.editing}
          />
          <ConfirmDialog
            open={!!deleteTarget}
            onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
            title="Delete division?"
            description={`"${deleteTarget?.name}" and all its data will be permanently removed.`}
            showErrorToast={false}
            onConfirm={async () => {
              if (!deleteTarget) return;
              try {
                await deleteMutation.mutateAsync(deleteTarget.id);
                toast.success('Division deleted.');
                await refetch();
              } catch (err) {
                toast.error(getApiErrorMessage(err, 'Failed to delete division'));
                throw err;
              } finally {
                setDeleteTarget(null);
              }
            }}
          />
        </>
      )}
    </QueryState>
  );
}
