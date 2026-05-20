import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionDiscipline } from '@/hooks/useDivisionResources';

export default function DivisionDisciplinePage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: stats = [], isLoading, isError, refetch } = useDivisionDiscipline(
    tournamentSlug,
    divisionSlug,
  );

  return (
    <PageContent>
      <h2 className="text-xl font-black uppercase mb-6">Discipline</h2>
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <StatsLeaderboard stats={stats} statField="yellow_cards" statLabel="YC" />
      </QueryState>
    </PageContent>
  );
}
