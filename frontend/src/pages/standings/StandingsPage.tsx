import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import StandingsTable from '@/components/StandingsTable';
import { useDivisions } from '@/hooks/useDivisions';
import { useStandings } from '@/hooks/useStandings';
import { Link } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';
import type { Division } from '@/types';
import { getDivisionStandingsPath } from '@/lib/division-routes';

function DivisionStandingsPreview({ division }: { division: Division }) {
  const { data: standings = [], isLoading } = useStandings(division.id);
  const fullPath = getDivisionStandingsPath(division);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white rounded-2xl h-48 border border-border" />
    );
  }

  return (
    <div className="home-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">{division.name}</h2>
        {fullPath && (
          <Link
            to={fullPath}
            className="text-sm text-primary font-bold flex items-center gap-1 hover:underline"
          >
            Full Table <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <StandingsTable standings={standings} compact />
    </div>
  );
}

export default function StandingsPage() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();

  return (
    <PageLayout>
      <PageHeader title="Standings" subtitle="League tables across all divisions" icon={Trophy} />

      <PageContent innerClassName="max-w-7xl">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={divisions.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No division standings available."
          >
            <div className="space-y-10">
              {divisions.map((division) => (
                <DivisionStandingsPreview key={division.id} division={division} />
              ))}
            </div>
          </QueryState>
        </PageContent>
    </PageLayout>
  );
}
