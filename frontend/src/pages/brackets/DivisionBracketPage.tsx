import { useParams } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import BracketView from '@/components/BracketView';
import { useDivisionBySlug } from '@/hooks/useDivisions';
import { useBracket } from '@/hooks/useBrackets';

export default function DivisionBracketPage() {
  const { divisionSlug } = useParams();
  const { data: division, isLoading: divisionLoading } = useDivisionBySlug(divisionSlug);
  const { data: nodes = [], isLoading, isError, refetch } = useBracket(divisionSlug);

  return (
    <PageLayout>
      <PageHeader title={division ? `${division.name} Bracket` : 'Bracket'} />

      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <QueryState
            isLoading={isLoading || divisionLoading}
            isError={isError}
            isEmpty={nodes.length === 0}
            onRetry={() => refetch()}
            emptyMessage="Bracket has not been generated yet."
          >
            <BracketView nodes={nodes} />
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
