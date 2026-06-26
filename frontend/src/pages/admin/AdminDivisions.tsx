import { useCallback, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useListSearch } from '@/hooks/useListSearch';
import { divisionSearchText } from '@/lib/search-text';
import DivisionFormDialog from '@/components/admin/forms/DivisionFormDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useDivisions, useDeleteDivision, useGenerateSchedule } from '@/hooks/useDivisions';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import type { Division } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { getDivisionPublicPath } from '@/lib/division-routes';
import { getDivisionTheme, themeChipStyle } from '@/lib/division-theme';
import { ExternalLink, Pencil, Trash2, Calendar, Flag, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminDivisions() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();
  const { data: teams = [] } = useTeams();
  const { data: matches = [] } = useMatches();
  const deleteMutation = useDeleteDivision();
  const generateMutation = useGenerateSchedule();
  const formDialog = useFormDialog<Division>();
  const [deleteTarget, setDeleteTarget] = useState<Division | null>(null);
  const [generateTarget, setGenerateTarget] = useState<{ division: Division; matchCount: number } | null>(null);
  const getText = useCallback((d: Division) => divisionSearchText(d), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    divisions,
    getText,
  );

  const runGenerateSchedule = async (d: Division, existingMatches: number) => {
    try {
      const res = await generateMutation.mutateAsync({
        id: d.id,
        body: { matchIntervalMinutes: 90 },
        force: existingMatches > 0,
      });
      toast.success(`Created ${res.data.created} matches.`);
      refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to generate schedule'));
    }
  };

  const requestGenerateSchedule = (d: Division, matchCount: number) => {
    if (matchCount > 0) {
      setGenerateTarget({ division: d, matchCount });
      return;
    }
    void runGenerateSchedule(d, matchCount);
  };

  return (
    <AdminLayout title="Divisions">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search divisions…"
            className="max-w-md"
          />
          <Button onClick={formDialog.openCreate} className="shrink-0">
            Add Division
          </Button>
        </div>
        {hasQuery && filtered.length === 0 ? (
          <SearchEmpty query={debouncedSearch} entityLabel="divisions" />
        ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((division) => {
            const theme = getDivisionTheme(division);
            const tournamentSlug = division.tournament?.slug;
            const publicPath =
              tournamentSlug && division.slug
                ? getDivisionPublicPath(tournamentSlug, division.slug)
                : null;
            const teamCount = teams.filter((t) => t.division_id === division.id).length;
            const matchCount = matches.filter((m) => m.division_id === division.id).length;

            return (
              <div key={division.id} className="admin-card p-4">
                <div className="flex items-start gap-4">
                  <div
                    className="theme-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={themeChipStyle(theme)}
                  >
                    <Flag className="h-6 w-6" style={{ color: theme.primary }} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold" style={{ color: theme.primary }}>
                      {division.name}
                    </h3>
                    {division.schedule_only && (
                      <Badge variant="secondary" className="mt-1">
                        <CalendarDays className="mr-1 h-3 w-3" aria-hidden />
                        Schedule only
                      </Badge>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {division.tournament?.name ?? '—'}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {teamCount} teams · {matchCount} matches
                    </p>
                    {publicPath && (
                      <p className="mt-1 truncate font-mono text-xs text-zinc-400">{publicPath}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  {publicPath && (
                    <a
                      href={publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      View public
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestGenerateSchedule(division, matchCount)}
                    disabled={teamCount < 2 || generateMutation.isPending}
                  >
                    <Calendar className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Schedule
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => formDialog.openEdit(division)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteTarget(division)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </QueryState>

      <DivisionFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        division={formDialog.editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This division and its data will be permanently removed."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success('Division deleted.');
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to delete division'));
          }
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={!!generateTarget}
        onOpenChange={(open) => !open && setGenerateTarget(null)}
        title="Replace existing matches?"
        description="This division already has matches. Generating a new schedule will replace them."
        confirmLabel="Replace matches"
        onConfirm={async () => {
          if (!generateTarget) return;
          await runGenerateSchedule(generateTarget.division, generateTarget.matchCount);
          setGenerateTarget(null);
        }}
      />
    </AdminLayout>
  );
}
