import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import TournamentFormDialog from '@/components/admin/forms/TournamentFormDialog';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { AdminContextBar } from '@/components/admin/inline/AdminContextBar';
import { AdminActionButton } from '@/components/admin/inline/AdminActionButton';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useTournaments, usePurgeTournament } from '@/hooks/useTournaments';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/errors';
import { useListSearch } from '@/hooks/useListSearch';
import { tournamentSearchText } from '@/lib/search-text';
import { Trophy, Calendar, MapPin, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date';
import type { Tournament } from '@/types';

export default function TournamentsPage() {
  const { data: tournaments = [], isLoading, isError, refetch } = useTournaments();
  const canEdit = useCanAdminEdit();
  const formDialog = useFormDialog<Tournament>();
  const deleteMutation = usePurgeTournament();
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);

  const getText = useCallback((t: (typeof tournaments)[0]) => tournamentSearchText(t), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    tournaments,
    getText,
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Tournament deleted.');
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete tournament'));
      throw err;
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <PageLayout>
      <PageHeader title="Tournaments" subtitle="All BC Tigers soccer competitions" icon={Trophy} />

      <PageContent>
        <AdminContextBar
          label="Editing tournaments"
          advancedHref="/admin/tournaments"
          advancedLabel="Admin view"
          actions={
            <AdminActionButton onClick={formDialog.openCreate}>
              <Plus className="h-3 w-3" />
              Add tournament
            </AdminActionButton>
          }
        />

        {!isLoading && tournaments.length > 0 && (
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search tournaments by name, location…"
            className="mb-5"
          />
        )}

        <QueryState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && tournaments.length === 0}
          onRetry={() => refetch()}
          emptyMessage="No tournaments available yet."
        >
          {hasQuery && filtered.length === 0 ? (
            <SearchEmpty query={debouncedSearch} entityLabel="tournaments" />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t) => (
                <div key={t.id} className="group relative">
                  <Link
                    to={`/tournaments/${t.slug}`}
                    className="ds-card-hover h-full overflow-hidden block"
                  >
                    {/* Image / icon area — no badges here so admin buttons have clear space */}
                    <div className="relative flex h-20 items-center justify-center border-b border-border bg-surface-muted">
                      {t.logo ? (
                        <img
                          src={t.logo}
                          alt=""
                          className="h-14 w-14 rounded-xl border border-border bg-card object-contain p-1.5 shadow-sm transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
                          <Trophy className="h-7 w-7 text-primary" aria-hidden />
                        </div>
                      )}
                    </div>

                    {/* Text area */}
                    <div className="flex flex-1 flex-col p-3.5">
                      {/* Status + type badges — inside text area, never overlapping admin buttons */}
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={
                            t.status === 'ACTIVE'
                              ? 'success'
                              : t.status === 'UPCOMING'
                                ? 'scheduled'
                                : 'default'
                          }
                          className="rounded-md"
                        >
                          {t.status === 'ACTIVE' ? 'Active' : t.status}
                        </Badge>
                        <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {t.tournament_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h2 className="text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                        {t.name}
                      </h2>
                      {t.description && (
                        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">
                          {t.description}
                        </p>
                      )}

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                          <span>
                            {formatDate(t.start_date)} – {formatDate(t.end_date)}
                          </span>
                        </div>
                        {t.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                            <span>{t.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          View divisions & schedule
                        </span>
                        <ChevronRight
                          className="h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                          aria-hidden
                        />
                      </div>
                    </div>
                  </Link>

                  {/* Admin hover actions — top-right of image area, no badge overlap */}
                  {canEdit && (
                    <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <AdminActionButton
                        size="xs"
                        onClick={(e) => { e.preventDefault(); formDialog.openEdit(t); }}
                        aria-label={`Edit ${t.name}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </AdminActionButton>
                      <AdminActionButton
                        size="xs"
                        variant="destructive"
                        onClick={(e) => { e.preventDefault(); setDeleteTarget(t); }}
                        aria-label={`Delete ${t.name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </AdminActionButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </QueryState>
      </PageContent>

      <TournamentFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        tournament={formDialog.editing}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete tournament?"
        description={`"${deleteTarget?.name}" and all its divisions, teams, and matches will be permanently removed.`}
        showErrorToast={false}
        onConfirm={handleDelete}
      />
    </PageLayout>
  );
}
