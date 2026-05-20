import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import { useDisciplineStats } from '@/hooks/useStats';
import { AlertTriangle } from 'lucide-react';

export default function DisciplinePage() {
  const { data: stats = [], isLoading, isError, refetch } = useDisciplineStats();

  return (
    <PageLayout>
      <PageHeader title="Discipline" icon={AlertTriangle} />

      <PageContent innerClassName="max-w-3xl">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={stats.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No discipline stats available."
          >
            <StatsLeaderboard stats={stats} statField="yellow_cards" statLabel="YC" />
          </QueryState>
        </PageContent>
    </PageLayout>
  );
}
