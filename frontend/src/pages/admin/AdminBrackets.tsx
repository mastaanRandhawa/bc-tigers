import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import BracketView from '@/components/BracketView';
import QueryState from '@/components/shared/QueryState';
import { Button } from '@/components/ui/button';
import { useDivisions } from '@/hooks/useDivisions';
import { useBracket, useGenerateBracket, useAdvanceBracket } from '@/hooks/useBrackets';
import { getApiErrorMessage } from '@/lib/errors';
import type { BracketNode } from '@/types';
import { GitBranch, AlertTriangle } from 'lucide-react';

export default function AdminBrackets() {
  const { data: divisions = [], isLoading: divisionsLoading } = useDivisions();
  const [divisionId, setDivisionId] = useState('');
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [advanceError, setAdvanceError] = useState('');

  const selectedDivision = divisions.find((d) => d.id === divisionId);

  const {
    data: bracket,
    isLoading: bracketLoading,
    isError: bracketError,
    refetch,
  } = useBracket(selectedDivision?.slug);

  const generateMutation = useGenerateBracket();
  const advanceMutation = useAdvanceBracket();

  const handleGenerate = async () => {
    if (!divisionId) return;
    try {
      await generateMutation.mutateAsync(divisionId);
      setConfirmGenerate(false);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to generate bracket'));
    }
  };

  const handleAdvance = async (node: BracketNode, winnerId: string) => {
    setAdvanceError('');
    try {
      await advanceMutation.mutateAsync({ nodeId: node.id, winnerId });
    } catch (err) {
      setAdvanceError(getApiErrorMessage(err, 'Failed to advance bracket'));
    }
  };

  const divisionOptions = divisions.map((d) => ({ value: d.id, label: d.name }));

  const nodes: BracketNode[] = bracket ?? [];

  return (
    <AdminLayout title="Brackets">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-xs">
          <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Division
          </label>
          <select
            value={divisionId}
            onChange={(e) => { setDivisionId(e.target.value); setConfirmGenerate(false); setAdvanceError(''); }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Select division"
          >
            <option value="">Select a division…</option>
            {divisionOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {divisionId && !bracketLoading && (
          <div>
            {nodes.length === 0 ? (
              confirmGenerate ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> This cannot be undone.
                  </span>
                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    className="shrink-0"
                  >
                    {generateMutation.isPending ? 'Generating…' : 'Confirm Generate'}
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmGenerate(false)} className="shrink-0">
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setConfirmGenerate(true)} className="shrink-0">
                  <GitBranch className="h-4 w-4 mr-1.5" aria-hidden />
                  Generate Bracket
                </Button>
              )
            ) : null}
          </div>
        )}
      </div>

      {advanceError && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {advanceError}
        </p>
      )}

      {!divisionId ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <GitBranch className="h-10 w-10 text-muted-foreground/40" aria-hidden />
          <p className="text-sm text-muted-foreground">Select a division to view or generate its bracket.</p>
        </div>
      ) : (
        <QueryState
          isLoading={divisionsLoading || bracketLoading}
          isError={bracketError}
          onRetry={() => refetch()}
          isEmpty={nodes.length === 0}
          emptyMessage="No bracket generated yet for this division."
        >
          <div className="space-y-6">
            <BracketView nodes={nodes} />

            {nodes.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Advance Winner</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Select a match node and pick the winning team to advance them in the bracket.
                </p>
                <div className="flex flex-wrap gap-2">
                  {nodes
                    .filter((n) => n.home_team && n.away_team && !n.winner_id)
                    .map((node) => (
                      <div key={node.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                        <span className="font-medium text-foreground">{node.home_team?.name} vs {node.away_team?.name}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => node.home_team && handleAdvance(node, node.home_team.id)}
                          disabled={advanceMutation.isPending}
                          className="h-6 px-2 text-xs"
                        >
                          {node.home_team?.name}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => node.away_team && handleAdvance(node, node.away_team.id)}
                          disabled={advanceMutation.isPending}
                          className="h-6 px-2 text-xs"
                        >
                          {node.away_team?.name}
                        </Button>
                      </div>
                    ))}
                  {nodes.filter((n) => n.home_team && n.away_team && !n.winner_id).length === 0 && (
                    <p className="text-xs text-muted-foreground">All matches decided.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </QueryState>
      )}
    </AdminLayout>
  );
}
