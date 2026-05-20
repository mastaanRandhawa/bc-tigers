import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import { useMatches } from '@/hooks/useMatches';
import type { MatchStatus } from '@/types';
import { Swords } from 'lucide-react';

const statusFilters: { label: string; value: MatchStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Live', value: 'LIVE' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Completed', value: 'COMPLETED' },
];

export default function MatchesPage() {
  const [filter, setFilter] = useState<MatchStatus | 'ALL'>('ALL');
  const params = filter === 'ALL' ? undefined : { status: filter };
  const { data: matches = [], isLoading, isError, refetch } = useMatches(params);

  return (
    <PageLayout>
      <PageHeader title="Matches" subtitle="All fixtures, results and live scores" icon={Swords} />

      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-6 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  filter === f.value
                    ? 'bg-[#0038FF] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#0038FF] hover:text-[#0038FF]'
                }`}
              >
                {f.label}
                {f.value === 'LIVE' && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-red-400 inline-block animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={matches.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No matches found."
          >
            <div className="space-y-3">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
