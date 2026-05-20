import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import { useDisciplineStats } from '@/hooks/useStats';
import { AlertTriangle } from 'lucide-react';

export default function DisciplinePage() {
  const { data: stats = [], isLoading, isError, refetch } = useDisciplineStats();

  return (
    <PageLayout>
      <PageHeader title="Discipline" icon={AlertTriangle} />

      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={stats.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No discipline stats available."
          >
            <StatsLeaderboard stats={stats} statField="yellow_cards" statLabel="YC" />
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
