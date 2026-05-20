import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import { useTopAssists } from '@/hooks/useStats';
import { TrendingUp } from 'lucide-react';

export default function TopAssistsPage() {
  const { data: stats = [], isLoading, isError, refetch } = useTopAssists();

  return (
    <PageLayout>
      <PageHeader title="Top Assists" icon={TrendingUp} />

      <PageContent innerClassName="max-w-3xl">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={stats.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No assist stats available."
          >
            <StatsLeaderboard stats={stats} statField="assists" statLabel="Assists" />
          </QueryState>
        </PageContent>
    </PageLayout>
  );
}
