import { useState } from 'react';
import { Link } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionMatches } from '@/hooks/useDivisionResources';
import { divisionMatchPath } from '@/lib/division-routes';
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

  return (
    <>
      <DivisionPageHeader title="Matches" subtitle="Live, upcoming, and completed fixtures" />
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === f.value
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={matches.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No matches in this division."
      >
        <div className="space-y-3">
          {matches.map((m) => (
            <Link key={m.id} to={divisionMatchPath(tournamentSlug, divisionSlug, m.id)}>
              <MatchCard match={m} />
            </Link>
          ))}
        </div>
      </QueryState>
    </>
  );
}
