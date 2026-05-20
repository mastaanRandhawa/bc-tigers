import AdminLayout from '@/components/AdminLayout';
import QueryState from '@/components/shared/QueryState';
import { useMatches } from '@/hooks/useMatches';
import MatchCard from '@/components/MatchCard';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Match } from '@/types';

export default function AdminSchedules() {
  const { data: matches = [], isLoading, isError, refetch } = useMatches();

  const grouped = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const date = m.scheduled_start.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(m);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <AdminLayout title="Schedules">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={sortedDates.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No matches scheduled yet."
      >
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-[#0038FF]" />
                <h2 className="font-black text-gray-900">{formatDate(date)}</h2>
              </div>
              <div className="space-y-3">
                {grouped[date].map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
            </div>
          ))}
        </div>
      </QueryState>
    </AdminLayout>
  );
}
