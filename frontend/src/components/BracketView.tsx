import type { BracketNode } from '@/types';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

const STAGE_LABELS: Record<string, string> = {
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINAL: 'Quarter Finals',
  SEMI_FINAL: 'Semi Finals',
  FINAL: 'Final',
  THIRD_PLACE: '3rd Place',
};

interface BracketMatchProps {
  node: BracketNode;
}

function BracketMatch({ node }: BracketMatchProps) {
  const isFinal = node.stage === 'FINAL';
  return (
    <div className={cn('bg-surface rounded-lg border border-border shadow-sm min-w-[180px]', isFinal ? 'border-primary/30' : '')}>
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 border-b',
        node.winner_id === node.home_team_id ? 'bg-primary-muted' : ''
      )}>
        {node.home_team?.logo && (
          <img src={node.home_team.logo} alt="" className="w-5 h-5 rounded-full object-cover" />
        )}
        <span className={cn('text-sm flex-1 truncate', node.winner_id === node.home_team_id ? 'font-black text-primary' : 'font-medium text-gray-700')}>
          {node.home_team?.name ?? 'TBD'}
        </span>
        {node.match && (
          <span className="text-sm font-bold text-foreground">{node.match.home_score}</span>
        )}
      </div>
      <div className={cn(
        'flex items-center gap-2 px-3 py-2',
        node.winner_id === node.away_team_id ? 'bg-primary-muted' : ''
      )}>
        {node.away_team?.logo && (
          <img src={node.away_team.logo} alt="" className="w-5 h-5 rounded-full object-cover" />
        )}
        <span className={cn('text-sm flex-1 truncate', node.winner_id === node.away_team_id ? 'font-black text-primary' : 'font-medium text-gray-700')}>
          {node.away_team?.name ?? 'TBD'}
        </span>
        {node.match && (
          <span className="text-sm font-bold text-foreground">{node.match.away_score}</span>
        )}
      </div>
    </div>
  );
}

interface BracketViewProps {
  nodes: BracketNode[];
}

export default function BracketView({ nodes }: BracketViewProps) {
  const stages = ['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL', 'THIRD_PLACE'] as const;
  const stagesPresent = stages.filter((s) => nodes.some((n) => n.stage === s));

  if (nodes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-semibold">Bracket not yet generated</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {stagesPresent.map((stage) => (
          <div key={stage} className="flex flex-col">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground text-center mb-4">
              {STAGE_LABELS[stage]}
            </h3>
            <div className="flex flex-col gap-4 justify-around flex-1">
              {nodes
                .filter((n) => n.stage === stage)
                .sort((a, b) => a.position - b.position)
                .map((node) => (
                  <BracketMatch key={node.id} node={node} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
