import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import { useTopScorers } from '@/hooks/useStats';
import { TrendingUp } from 'lucide-react';

export default function TopScorersPage() {
  const { data: stats = [], isLoading, isError, refetch } = useTopScorers();

  return (
    <PageLayout>
      <PageHeader title="Top Scorers" icon={TrendingUp} />

      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={stats.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No scoring stats available."
          >
            <StatsLeaderboard stats={stats} statField="goals" statLabel="Goals" />
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
