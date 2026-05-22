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
import type { MatchStatus } from '@/types';

const filters: { label: string; value: MatchStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Live', value: 'LIVE' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Completed', value: 'COMPLETED' },
];

type ViewMode = 'list' | 'calendar';

export default function DivisionMatchesAndSchedulePage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ViewMode = searchParams.get('view') === 'calendar' ? 'calendar' : 'list';
  const [filter, setFilter] = useState<MatchStatus | 'ALL'>('ALL');

  const { data: allMatches = [], isLoading, isError, refetch } = useDivisionMatches(
    tournamentSlug,
    divisionSlug,
  );

  const matches = useMemo(() => {
    if (filter === 'ALL') return allMatches;
    return allMatches.filter((m) => m.status === filter);
  }, [allMatches, filter]);

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

  return (
    <>
      <DivisionPageHeader
        title="Matches & Schedule"
        subtitle="Live, upcoming, and completed fixtures"
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
              Calendar
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
        ) : view === 'calendar' ? (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {formatScheduleDay(date)}
                </h3>
                <div className="space-y-2">
                  {grouped[date].map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </QueryState>
    </>
  );
}
