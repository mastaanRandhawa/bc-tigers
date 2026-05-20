import { useParams } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import { useDivisionBySlug } from '@/hooks/useDivisions';
import { useMatches } from '@/hooks/useMatches';
import { Calendar } from 'lucide-react';

export default function DivisionSchedulePage() {
  const { divisionSlug } = useParams();
  const { data: division, isLoading: divisionLoading } = useDivisionBySlug(divisionSlug);
  const { data: matches = [], isLoading, isError, refetch } = useMatches(
    division ? { divisionId: division.id } : undefined
  );

  return (
    <PageLayout>
      <PageHeader title={division ? `${division.name} Schedule` : 'Schedule'} icon={Calendar} />

      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <QueryState
            isLoading={isLoading || divisionLoading}
            isError={isError}
            isEmpty={matches.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No matches scheduled for this division."
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
