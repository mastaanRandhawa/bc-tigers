import type { BracketNode } from '@/types';
import BracketView from '@/components/BracketView';
import { Button } from '@/components/ui/button';
import { useAdvanceBracket } from '@/hooks/useBrackets';
import { getApiErrorMessage } from '@/lib/errors';

interface AdminBracketViewProps {
  nodes: BracketNode[];
}

export default function AdminBracketView({ nodes }: AdminBracketViewProps) {
  const advanceMutation = useAdvanceBracket();

  const handleAdvance = async (node: BracketNode, winnerId: string) => {
    if (!confirm('Advance this winner to the next round?')) return;
    try {
      await advanceMutation.mutateAsync({ nodeId: node.id, winnerId });
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to advance bracket'));
    }
  };

  const completedNodes = nodes.filter(
    (n) => n.home_team_id && n.away_team_id && n.match?.status === 'COMPLETED',
  );

  return (
    <div className="space-y-4">
      <BracketView nodes={nodes} />
      {completedNodes.length > 0 && (
        <div className="rounded-lg border border-border bg-zinc-50 p-4 space-y-2">
          <p className="text-sm font-medium text-foreground m-0">Advance winners</p>
          {completedNodes.map((node) => (
            <div
              key={node.id}
              className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0"
            >
              <span>
                {node.home_team?.name} vs {node.away_team?.name}
              </span>
              <div className="flex gap-2">
                {node.home_team_id && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={advanceMutation.isPending}
                    onClick={() => handleAdvance(node, node.home_team_id!)}
                  >
                    {node.home_team?.name} wins
                  </Button>
                )}
                {node.away_team_id && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={advanceMutation.isPending}
                    onClick={() => handleAdvance(node, node.away_team_id!)}
                  >
                    {node.away_team?.name} wins
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
