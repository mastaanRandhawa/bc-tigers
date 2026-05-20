import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import { useTopScorers } from '@/hooks/useStats';
import { TrendingUp } from 'lucide-react';

export default function TopScorersPage() {
  const { data: stats = [], isLoading, isError, refetch } = useTopScorers();

  return (
    <PageLayout>
      <PageHeader title="Top Scorers" icon={TrendingUp} />

      <PageContent innerClassName="max-w-3xl">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={stats.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No scoring stats available."
          >
            <StatsLeaderboard stats={stats} statField="goals" statLabel="Goals" />
          </QueryState>
        </PageContent>
    </PageLayout>
  );
}
