import { useCallback, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { divisionSearchText } from '@/lib/search-text';
import BracketView from '@/components/BracketView';
import QueryState from '@/components/shared/QueryState';
import { useDivisions } from '@/hooks/useDivisions';
import { useBracket, useGenerateBracket } from '@/hooks/useBrackets';
import { Button } from '@/components/ui/button';
import { GitBranch } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/errors';

export default function AdminBrackets() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const getText = useCallback((d: (typeof divisions)[0]) => divisionSearchText(d), []);
  const { search, setSearch, filtered: filteredDivisions, debouncedSearch, hasQuery } =
    useListSearch(divisions, getText);

  const division =
    filteredDivisions.find((d) => d.id === selectedId) ??
    filteredDivisions[0] ??
    divisions.find((d) => d.id === selectedId) ??
    divisions[0];
  const { data: nodes = [] } = useBracket(division?.slug);
  const generateMutation = useGenerateBracket();

  const handleGenerate = async () => {
    if (!division) return;
    if (!confirm(`Generate bracket for ${division.name}?`)) return;
    try {
      await generateMutation.mutateAsync(division.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to generate bracket'));
    }
  };

  return (
    <AdminLayout title="Brackets">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={divisions.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No divisions found."
      >
        {division && (
          <div className="space-y-4">
            {divisions.length > 5 && (
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search divisions…"
                className="max-w-md"
              />
            )}
            {hasQuery && filteredDivisions.length === 0 ? (
              <SearchEmpty query={debouncedSearch} entityLabel="divisions" />
            ) : (
            <div className="flex flex-wrap gap-2">
              {filteredDivisions.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${(selectedId ?? divisions[0]?.id) === d.id ? 'bg-primary text-white' : 'bg-white border border-border text-muted-foreground hover:border-primary'}`}
                >
                  {d.name}
                </button>
              ))}
            </div>
            )}

            <div className="rounded-lg border border-border bg-card shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-primary" /> {division.name} Bracket
                </h2>
                <Button size="sm" onClick={handleGenerate} disabled={generateMutation.isPending}>
                  Generate Bracket
                </Button>
              </div>
              <BracketView nodes={nodes} />
            </div>
          </div>
        )}
      </QueryState>
    </AdminLayout>
  );
}
