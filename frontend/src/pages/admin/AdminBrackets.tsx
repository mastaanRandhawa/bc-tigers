import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
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
  const division = divisions.find((d) => d.id === selectedId) ?? divisions[0];
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
            <div className="flex flex-wrap gap-2">
              {divisions.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${(selectedId ?? divisions[0]?.id) === d.id ? 'bg-[#0038FF] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0038FF]'}`}
                >
                  {d.name}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-[#0038FF]" /> {division.name} Bracket
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
