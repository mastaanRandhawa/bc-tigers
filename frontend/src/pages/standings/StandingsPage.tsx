import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import StandingsTable from '@/components/StandingsTable';
import { useDivisions } from '@/hooks/useDivisions';
import { useStandings } from '@/hooks/useStandings';
import { Link } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';

function DivisionStandingsPreview({ divisionId, divisionName, divisionSlug }: {
  divisionId: string;
  divisionName: string;
  divisionSlug: string;
}) {
  const { data: standings = [], isLoading } = useStandings(divisionId);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white rounded-2xl h-48 border border-gray-100" />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{divisionName}</h2>
        <Link
          to={`/standings/${divisionSlug}`}
          className="text-sm text-[#0038FF] font-semibold flex items-center gap-1 hover:underline"
        >
          Full Table <ChevronRight className="w-4 h-4" />
        </Link>
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

      <section className="py-10 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={divisions.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No division standings available."
          >
            <div className="space-y-10">
              {divisions.map((division) => (
                <DivisionStandingsPreview
                  key={division.id}
                  divisionId={division.id}
                  divisionName={division.name}
                  divisionSlug={division.slug}
                />
              ))}
            </div>
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
