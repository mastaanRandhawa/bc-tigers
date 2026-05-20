import { useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import StandingsTable from '@/components/StandingsTable';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useDivisions } from '@/hooks/useDivisions';
import { useStandings, useRecalculateStandings } from '@/hooks/useStandings';
import { useListSearch } from '@/hooks/useListSearch';
import { divisionSearchText } from '@/lib/search-text';
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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{division.name}</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRecalculate}
          disabled={recalculateMutation.isPending}
        >
          <RefreshCw
            className={`h-4 w-4 ${recalculateMutation.isPending ? 'animate-spin' : ''}`}
            aria-hidden
          />
          Recalculate
        </Button>
      </div>
      <StandingsTable standings={standings} division={division} searchable={standings.length > 6} />
    </div>
  );
}

export default function AdminStandings() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();
  const getText = useCallback((d: Division) => divisionSearchText(d), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    divisions,
    getText,
  );

  return (
    <AdminLayout title="Standings">
      {divisions.length > 0 && (
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search divisions…"
          className="mb-6 max-w-md"
        />
      )}
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={divisions.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No divisions found."
      >
        {hasQuery && filtered.length === 0 ? (
          <SearchEmpty query={debouncedSearch} entityLabel="divisions" />
        ) : (
          <div className="space-y-8">
            {filtered.map((div) => (
              <DivisionStandingsSection key={div.id} division={div} />
            ))}
          </div>
        )}
      </QueryState>
    </AdminLayout>
  );
}
