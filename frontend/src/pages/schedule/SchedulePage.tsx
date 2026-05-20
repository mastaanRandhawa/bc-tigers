import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import DivisionDirectoryCard from '@/components/shared/DivisionDirectoryCard';
import { useMatches } from '@/hooks/useMatches';
import { useDivisions } from '@/hooks/useDivisions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDivisionSchedulePath } from '@/lib/division-routes';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SchedulePage() {
  const navigate = useNavigate();
  const { data: divisions = [] } = useDivisions();
  const { data: matches = [], isLoading, isError, refetch } = useMatches();

  const grouped = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    const date = match.scheduled_start.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});

  const handleDivisionChange = (value: string) => {
    if (value === 'ALL') return;
    const division = divisions.find((d) => d.id === value);
    if (!division) return;
    const path = getDivisionSchedulePath(division);
    if (path) navigate(path);
  };

  return (
    <PageLayout>
      <PageHeader title="Schedule" subtitle="Browse by division or view all fixtures" icon={Calendar} />

      <PageContent innerClassName="max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase text-gray-600 mb-3">Jump to division</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {divisions.map((division) => (
              <DivisionDirectoryCard key={division.id} division={division} />
            ))}
          </div>
          <Select onValueChange={handleDivisionChange}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Open division schedule…" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <h2 className="text-lg font-black uppercase mb-4">All divisions</h2>
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
                    <Calendar className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-foreground">{formatDate(date)}</h3>
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
      </PageContent>
    </PageLayout>
  );
}
