import QueryState from '@/components/shared/QueryState';
import BracketView from '@/components/BracketView';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionBracketResource } from '@/hooks/useDivisionResources';

export default function DivisionBracketPage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: nodes = [], isLoading, isError, refetch } = useDivisionBracketResource(
    tournamentSlug,
    divisionSlug,
  );

  return (
    <>
      <DivisionPageHeader title="Bracket" subtitle="Knockout stage progression" />
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={nodes.length === 0}
        onRetry={() => refetch()}
        emptyMessage="Bracket has not been generated yet."
      >
        <BracketView nodes={nodes} />
      </QueryState>
    </>
  );
}
