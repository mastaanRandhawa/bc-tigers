import AdminLayout from '@/components/AdminLayout';
import StandingsTable from '@/components/StandingsTable';
import QueryState from '@/components/shared/QueryState';
import { useDivisions } from '@/hooks/useDivisions';
import { useStandings, useRecalculateStandings } from '@/hooks/useStandings';
import type { Division } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/errors';

function DivisionStandingsSection({ division }: { division: Division }) {
  const { data: standings = [] } = useStandings(division.id);
  const recalculateMutation = useRecalculateStandings();

  const handleRecalculate = async () => {
    try {
      await recalculateMutation.mutateAsync(division.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to recalculate standings'));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-foreground text-lg">{division.name}</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRecalculate}
          disabled={recalculateMutation.isPending}
        >
          <RefreshCw className={`w-4 h-4 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} /> Recalculate
        </Button>
      </div>
      <StandingsTable standings={standings} />
    </div>
  );
}

export default function AdminStandings() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();

  return (
    <AdminLayout title="Standings">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={divisions.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No divisions found."
      >
        <div className="space-y-8">
          {divisions.map((div) => (
            <DivisionStandingsSection key={div.id} division={div} />
          ))}
        </div>
      </QueryState>
    </AdminLayout>
  );
}
