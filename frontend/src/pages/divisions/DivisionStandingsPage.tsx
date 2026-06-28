import QueryState from '@/components/shared/QueryState';
import GroupedStandingsTable from '@/components/GroupedStandingsTable';
import StandingsQualificationLegend from '@/components/StandingsQualificationLegend';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { Button } from '@/components/ui/button';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionStandingsResource } from '@/hooks/useDivisionResources';
import { useRecalculateStandings } from '@/hooks/useStandings';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/errors';

export default function DivisionStandingsPage() {
  const { division, tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: standings = [], isLoading, isError, refetch } = useDivisionStandingsResource(
    tournamentSlug,
    divisionSlug,
  );
  const recalculateMutation = useRecalculateStandings();
  const canEdit = useCanAdminEdit();

  const handleRecalculate = async () => {
    if (!division?.id) return;
    try {
      await recalculateMutation.mutateAsync(division.id);
      toast.success('Standings recalculated.');
      refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to recalculate standings'));
    }
  };

  return (
    <>
      <DivisionPageHeader title="Standings" subtitle="League table for this division" />
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={recalculateMutation.isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
            Recalculate standings
          </Button>
        </div>
      )}
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={standings.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No standings for this division yet."
      >
        <StandingsQualificationLegend divisionSlug={division?.slug} />
        <GroupedStandingsTable standings={standings} division={division} />
      </QueryState>
    </>
  );
}
