import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionMatches } from '@/hooks/useDivisionResources';
import { formatDate } from '@/lib/utils';

export default function DivisionSchedulePage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: matches = [], isLoading, isError, refetch } = useDivisionMatches(
    tournamentSlug,
    divisionSlug,
  );

  const sorted = [...matches].sort(
    (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime(),
  );

  const grouped = sorted.reduce<Record<string, typeof sorted>>((acc, match) => {
    const date = match.scheduled_start.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});

  return (
    <PageContent innerClassName="max-w-4xl">
      <h2 className="text-xl font-black uppercase mb-6">Schedule</h2>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={sorted.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No matches scheduled for this division."
      >
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayMatches]) => (
            <div key={date}>
              <h3 className="text-sm font-black uppercase text-gray-600 mb-3">
                {formatDate(date)}
              </h3>
              <div className="space-y-3">
                {dayMatches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </QueryState>
    </PageContent>
  );
}
