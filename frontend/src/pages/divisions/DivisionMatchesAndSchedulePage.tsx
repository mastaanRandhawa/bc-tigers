import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import MatchCard from '@/components/MatchCard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionMatches } from '@/hooks/useDivisionResources';
import { useListSearch } from '@/hooks/useListSearch';
import { matchSearchText } from '@/lib/search-text';
import { formatScheduleDay } from '@/lib/date';
import { cn } from '@/lib/utils';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import { AdminContextBar } from '@/components/admin/inline/AdminContextBar';
import { AdminActionButton } from '@/components/admin/inline/AdminActionButton';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import MatchFormDialog from '@/components/admin/forms/MatchFormDialog';
import { useDeleteMatch } from '@/hooks/useMatches';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Match, MatchStatus } from '@/types';

const filters: { label: string; value: MatchStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Live', value: 'LIVE' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Completed', value: 'COMPLETED' },
];

type ViewMode = 'list' | 'calendar';

export default function DivisionMatchesAndSchedulePage() {
  const { tournamentSlug, divisionSlug, division } = useDivisionRoute();
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ViewMode = searchParams.get('view') === 'calendar' ? 'calendar' : 'list';
  const [filter, setFilter] = useState<MatchStatus | 'ALL'>('ALL');

  const { data: allMatches = [], isLoading, isError, refetch } = useDivisionMatches(
    tournamentSlug,
    divisionSlug,
  );

  const canEdit = useCanAdminEdit();
  const matchDialog = useFormDialog<Match>();
  const deleteMutation = useDeleteMatch();
  const [deleteTarget, setDeleteTarget] = useState<Match | null>(null);
  const qc = useQueryClient();

  const matches = useMemo(() => {
    if (filter === 'ALL') return allMatches;
    return allMatches.filter((m) => m.status === filter);
  }, [allMatches, filter]);

  const activeFilterLabel = filters.find((f) => f.value === filter)?.label ?? '';

  const getText = useCallback((m: (typeof matches)[0]) => matchSearchText(m), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    matches,
    getText,
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allMatches.length };
    for (const m of allMatches) {
      counts[m.status] = (counts[m.status] ?? 0) + 1;
    }
    return counts;
  }, [allMatches]);

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime(),
    );
    return sorted.reduce<Record<string, typeof sorted>>((acc, match) => {
      const date = match.scheduled_start.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(match);
      return acc;
    }, {});
  }, [filtered]);

  const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  const setView = (next: ViewMode) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'calendar') {
      nextParams.set('view', 'calendar');
    } else {
      nextParams.delete('view');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    qc.invalidateQueries({ queryKey: ['division-resources'] });
    setDeleteTarget(null);
  };

  const renderMatchRow = (m: Match, index: number) => (
    <div key={m.id} className="group relative flex items-stretch">
      <div className="min-w-0 flex-1">
        <MatchCard match={m} flat divider={index > 0} />
      </div>
      {canEdit && (
        <div className="mr-2 flex shrink-0 flex-col items-center justify-center gap-1 border-l border-border/40 pl-2 opacity-0 transition-opacity group-hover:opacity-100">
          <AdminActionButton
            size="xs"
            variant="ghost"
            onClick={() => matchDialog.openEdit(m)}
            aria-label={`Edit match`}
          >
            <Pencil className="h-3 w-3" />
          </AdminActionButton>
          <AdminActionButton
            size="xs"
            variant="destructive"
            onClick={() => setDeleteTarget(m)}
            aria-label={`Delete match`}
          >
            <Trash2 className="h-3 w-3" />
          </AdminActionButton>
        </div>
      )}
    </div>
  );

  return (
    <>
      <DivisionPageHeader
        title="Matches & Schedule"
        subtitle="Live, upcoming, and completed fixtures"
      />

      <AdminContextBar
        label="Editing matches"
        advancedHref="/admin/matches"
        advancedLabel="All matches"
        actions={
          <AdminActionButton onClick={matchDialog.openCreate}>
            <Plus className="h-3 w-3" />
            Add match
          </AdminActionButton>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setView('list')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'calendar'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Schedule
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                  filter === f.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-card text-muted-foreground border border-border hover:border-primary/30',
                )}
              >
                {f.label}
                {statusCounts[f.value] != null && (
                  <span className="ml-1.5 opacity-80">({statusCounts[f.value]})</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search teams or venue…"
          className="max-w-md"
        />
      </div>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={allMatches.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No matches in this division."
      >
        {hasQuery && filtered.length === 0 ? (
          <SearchEmpty query={debouncedSearch} entityLabel="matches" />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {filter === 'ALL' ? '' : `${activeFilterLabel.toLowerCase()} `}matches in this division.
          </p>
        ) : view === 'calendar' ? (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {formatScheduleDay(date)}
                </h3>
                <div className="overflow-hidden rounded-md border border-border/60 bg-card">
                  {grouped[date].map((m, index) => renderMatchRow(m, index))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="match-list-perf overflow-hidden rounded-md border border-border/60 bg-card">
            {filtered.map((m, index) => renderMatchRow(m, index))}
          </div>
        )}
      </QueryState>

      {/* Dialogs */}
      <MatchFormDialog
        open={matchDialog.open}
        onOpenChange={matchDialog.setOpen}
        match={matchDialog.editing}
        defaultDivisionId={division.id}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete match?"
        description="This match and all its events will be permanently removed."
        onConfirm={handleDelete}
      />
    </>
  );
}
