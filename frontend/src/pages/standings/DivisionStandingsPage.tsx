import { useParams } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import StandingsTable from '@/components/StandingsTable';
import { useDivisionBySlug } from '@/hooks/useDivisions';
import { useStandings } from '@/hooks/useStandings';

export default function DivisionStandingsPage() {
  const { divisionSlug } = useParams();
  const { data: division, isLoading: divisionLoading, isError: divisionError, refetch: refetchDivision } =
    useDivisionBySlug(divisionSlug);
  const { data: standings = [], isLoading: standingsLoading, isError: standingsError, refetch: refetchStandings } =
    useStandings(division?.id);

  const isLoading = divisionLoading || standingsLoading;
  const isError = divisionError || standingsError;

  return (
    <PageLayout>
      <PageHeader title={division ? `${division.name} Standings` : 'Standings'} />

      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={!division}
            onRetry={() => {
              refetchDivision();
              refetchStandings();
            }}
            emptyMessage="Division not found."
          >
            <StandingsTable standings={standings} />
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
