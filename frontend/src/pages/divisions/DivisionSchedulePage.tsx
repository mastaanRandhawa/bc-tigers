import { useCallback, useMemo } from 'react';
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

export default function DivisionSchedulePage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: matches = [], isLoading, isError, refetch } = useDivisionMatches(
    tournamentSlug,
    divisionSlug,
  );

  const getText = useCallback((m: (typeof matches)[0]) => matchSearchText(m), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    matches,
    getText,
  );

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

  return (
    <>
      <DivisionPageHeader title="Schedule" subtitle="Match dates and kickoff times" />
      {matches.length > 0 && (
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search teams or venue…"
          className="mb-5 max-w-md"
        />
      )}
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={matches.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No matches scheduled for this division."
      >
        {hasQuery && filtered.length === 0 ? (
          <SearchEmpty query={debouncedSearch} entityLabel="matches" />
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
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
        )}
      </QueryState>
    </>
  );
}
