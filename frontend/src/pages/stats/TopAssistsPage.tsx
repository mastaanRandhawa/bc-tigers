import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import { useTopAssists } from '@/hooks/useStats';
import { TrendingUp } from 'lucide-react';

export default function TopAssistsPage() {
  const { data: stats = [], isLoading, isError, refetch } = useTopAssists();

  return (
    <PageLayout>
      <PageHeader title="Top Assists" icon={TrendingUp} />

      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={stats.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No assist stats available."
          >
            <StatsLeaderboard stats={stats} statField="assists" statLabel="Assists" />
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
