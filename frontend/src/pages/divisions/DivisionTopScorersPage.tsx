import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionTopScorers } from '@/hooks/useDivisionResources';
import { useDivisionPlayerHref } from '@/hooks/useDivisionPlayerHref';

export default function DivisionTopScorersPage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: stats = [], isLoading, isError, refetch } = useDivisionTopScorers(
    tournamentSlug,
    divisionSlug,
  );
  const getPlayerHref = useDivisionPlayerHref();

  return (
    <>
      <DivisionPageHeader title="Top Scorers" subtitle="Leading goal scorers" />
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <StatsLeaderboard
          stats={stats}
          statField="goals"
          statLabel="Goals"
          getPlayerHref={getPlayerHref}
        />
      </QueryState>
    </>
  );
}
