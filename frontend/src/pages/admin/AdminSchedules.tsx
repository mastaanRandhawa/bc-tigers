import { useCallback, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useMatches } from '@/hooks/useMatches';
import { useListSearch } from '@/hooks/useListSearch';
import { matchSearchText } from '@/lib/search-text';
import MatchCard from '@/components/MatchCard';
import { Calendar } from 'lucide-react';
import { formatScheduleDay } from '@/lib/date';
import type { Match } from '@/types';

export default function AdminSchedules() {
  const { data: matches = [], isLoading, isError, refetch } = useMatches();
  const getText = useCallback((m: Match) => matchSearchText(m), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    matches,
    getText,
  );

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Match[]>>((acc, m) => {
      const date = m.scheduled_start.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(m);
      return acc;
    }, {});
  }, [filtered]);

  const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <AdminLayout title="Schedules">
      {matches.length > 0 && (
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search teams, division, venue…"
          className="mb-6 max-w-md"
        />
      )}
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={matches.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No matches scheduled yet."
      >
        {hasQuery && filtered.length === 0 ? (
          <SearchEmpty query={debouncedSearch} entityLabel="matches" />
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" aria-hidden />
                  <h2 className="font-semibold text-foreground">{formatScheduleDay(date)}</h2>
                </div>
                <div className="space-y-3">
                  {grouped[date].map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </QueryState>
    </AdminLayout>
  );
}
