import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionTopAssists } from '@/hooks/useDivisionResources';

export default function DivisionTopAssistsPage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: stats = [], isLoading, isError, refetch } = useDivisionTopAssists(
    tournamentSlug,
    divisionSlug,
  );

  return (
    <>
      <DivisionPageHeader title="Top Assists" subtitle="Leading assist providers" />
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <StatsLeaderboard stats={stats} statField="assists" statLabel="Assists" />
      </QueryState>
    </>
  );
}
