import AdminLayout from '@/components/AdminLayout';
import Section from '@/components/shared/Section';
import { useStatsSummary } from '@/hooks/useStats';
import QueryState from '@/components/shared/QueryState';
import StatCard from '@/components/shared/StatCard';

export default function AdminAnalytics() {
  const { data, isLoading, isError, refetch } = useStatsSummary();

  return (
    <AdminLayout title="Analytics">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard value={data?.matches ?? 0} label="Total matches" />
          <StatCard value={data?.teams ?? 0} label="Teams" accent />
          <StatCard value={data?.players ?? 0} label="Players" />
          <StatCard value={data?.live_matches ?? 0} label="Live now" />
        </div>
      </QueryState>
    </AdminLayout>
  );
}
