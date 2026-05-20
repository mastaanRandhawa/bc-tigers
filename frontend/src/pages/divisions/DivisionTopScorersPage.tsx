import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionTopScorers } from '@/hooks/useDivisionResources';

export default function DivisionTopScorersPage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: stats = [], isLoading, isError, refetch } = useDivisionTopScorers(
    tournamentSlug,
    divisionSlug,
  );

  return (
    <>
      <DivisionPageHeader title="Top Scorers" subtitle="Leading goal scorers" />
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <StatsLeaderboard stats={stats} statField="goals" statLabel="Goals" />
      </QueryState>
    </>
  );
}
