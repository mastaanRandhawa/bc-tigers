import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import StandingsTable from '@/components/StandingsTable';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionStandingsResource } from '@/hooks/useDivisionResources';

export default function DivisionStandingsPage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: standings = [], isLoading, isError, refetch } = useDivisionStandingsResource(
    tournamentSlug,
    divisionSlug,
  );

  return (
    <PageContent>
      <h2 className="text-xl font-black uppercase mb-6">Standings</h2>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={standings.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No standings for this division yet."
      >
        <StandingsTable standings={standings} />
      </QueryState>
    </PageContent>
  );
}
