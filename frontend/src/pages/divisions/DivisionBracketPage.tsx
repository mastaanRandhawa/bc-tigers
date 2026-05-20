import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import BracketView from '@/components/BracketView';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionBracketResource } from '@/hooks/useDivisionResources';

export default function DivisionBracketPage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: nodes = [], isLoading, isError, refetch } = useDivisionBracketResource(
    tournamentSlug,
    divisionSlug,
  );

  return (
    <PageContent>
      <h2 className="text-xl font-black uppercase mb-6">Bracket</h2>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={nodes.length === 0}
        onRetry={() => refetch()}
        emptyMessage="Bracket has not been generated yet."
      >
        <div className="rounded-[2rem] border-2 border-gray-200 bg-gray-50 p-6 md:p-8">
          <BracketView nodes={nodes} />
        </div>
      </QueryState>
    </PageContent>
  );
}
