import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionTopScorers } from '@/hooks/useDivisionResources';

export default function DivisionTopScorersPage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: stats = [], isLoading, isError, refetch } = useDivisionTopScorers(
    tournamentSlug,
    divisionSlug,
  );

  return (
    <PageContent>
      <h2 className="text-xl font-black uppercase mb-6">Top Scorers</h2>
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <StatsLeaderboard stats={stats} statField="goals" statLabel="Goals" />
      </QueryState>
    </PageContent>
  );
}
