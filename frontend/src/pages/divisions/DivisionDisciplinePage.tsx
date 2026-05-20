import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionDiscipline } from '@/hooks/useDivisionResources';

export default function DivisionDisciplinePage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: stats = [], isLoading, isError, refetch } = useDivisionDiscipline(
    tournamentSlug,
    divisionSlug,
  );

  return (
    <>
      <DivisionPageHeader title="Discipline" subtitle="Cards and fair play records" />
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <StatsLeaderboard stats={stats} statField="yellow_cards" statLabel="YC" />
      </QueryState>
    </>
  );
}
