import { useCallback, useMemo, useState } from 'react';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import MatchCard from '@/components/MatchCard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionMatches } from '@/hooks/useDivisionResources';
import { useListSearch } from '@/hooks/useListSearch';
import { matchSearchText } from '@/lib/search-text';
import { cn } from '@/lib/utils';
import type { MatchStatus } from '@/types';

const filters: { label: string; value: MatchStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Live', value: 'LIVE' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Completed', value: 'COMPLETED' },
];

export default function DivisionMatchesPage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const [filter, setFilter] = useState<MatchStatus | 'ALL'>('ALL');
  const params = filter === 'ALL' ? undefined : { status: filter };
  const { data: matches = [], isLoading, isError, refetch } = useDivisionMatches(
    tournamentSlug,
    divisionSlug,
    params,
  );

  const getText = useCallback((m: (typeof matches)[0]) => matchSearchText(m), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    matches,
    getText,
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: matches.length };
    for (const m of matches) {
      counts[m.status] = (counts[m.status] ?? 0) + 1;
    }
    return counts;
  }, [matches]);

  return (
    <>
      <DivisionPageHeader title="Matches" subtitle="Live, upcoming, and completed fixtures" />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  : 'bg-white text-zinc-600 ring-1 ring-border hover:ring-primary/30',
              )}
            >
              {f.label}
              {statusCounts[f.value] != null && (
                <span className="ml-1.5 opacity-80">({statusCounts[f.value]})</span>
              )}
            </button>
          ))}
        </div>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search teams or venue…"
          className="max-w-md sm:mb-0"
        />
      </div>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={matches.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No matches in this division."
      >
        {hasQuery && filtered.length === 0 ? (
          <SearchEmpty query={debouncedSearch} entityLabel="matches" />
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
