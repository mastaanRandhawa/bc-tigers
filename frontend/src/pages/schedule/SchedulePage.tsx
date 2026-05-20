import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import { useMatches } from '@/hooks/useMatches';
import { useDivisions } from '@/hooks/useDivisions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SchedulePage() {
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const { data: divisions = [] } = useDivisions();
  const matchParams = divisionFilter === 'ALL' ? undefined : { divisionId: divisionFilter };
  const { data: matches = [], isLoading, isError, refetch } = useMatches(matchParams);

  const grouped = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    const date = match.scheduled_start.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});

  return (
    <PageLayout>
      <PageHeader title="Schedule" subtitle="Full fixture list across all divisions" icon={Calendar} />

      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Divisions</SelectItem>
                {divisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={matches.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No scheduled matches."
          >
            <div className="space-y-8">
              {Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, dayMatches]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-[#0038FF]" />
                      <h2 className="font-black text-gray-900 text-lg">{formatDate(date)}</h2>
                    </div>
                    <div className="space-y-3">
                      {dayMatches.map((m) => (
                        <MatchCard key={m.id} match={m} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
