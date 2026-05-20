import QueryState from '@/components/shared/QueryState';
import StandingsTable from '@/components/StandingsTable';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionStandingsResource } from '@/hooks/useDivisionResources';

export default function DivisionStandingsPage() {
  const { division, tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: standings = [], isLoading, isError, refetch } = useDivisionStandingsResource(
    tournamentSlug,
    divisionSlug,
  );

  return (
    <>
      <DivisionPageHeader title="Standings" subtitle="League table for this division" />
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={standings.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No standings for this division yet."
      >
        <StandingsTable standings={standings} division={division} />
      </QueryState>
    </>
  );
}
