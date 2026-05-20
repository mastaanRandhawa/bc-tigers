import type { BracketNode } from '@/types';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

const STAGE_LABELS: Record<string, string> = {
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINAL: 'Quarter-finals',
  SEMI_FINAL: 'Semi-finals',
  FINAL: 'Final',
  THIRD_PLACE: '3rd Place',
};

const STAGE_ORDER = ['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL', 'THIRD_PLACE'] as const;

interface BracketMatchProps {
  node: BracketNode;
}

function BracketMatch({ node }: BracketMatchProps) {
  const isFinal = node.stage === 'FINAL';
  const homeWins = node.winner_id === node.home_team_id;
  const awayWins = node.winner_id === node.away_team_id;

  return (
    <div
      className={cn(
        'bracket-match',
        isFinal && 'bracket-match-final',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 border-b border-border',
          homeWins && 'bg-primary-muted/50',
        )}
      >
        {node.home_team?.logo ? (
          <img src={node.home_team.logo} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-zinc-100 shrink-0" />
        )}
        <span
          className={cn(
            'text-sm flex-1 truncate',
            homeWins ? 'font-semibold text-foreground' : 'font-medium text-zinc-600',
          )}
        >
          {node.home_team?.name ?? 'TBD'}
        </span>
        {node.match != null && (
          <span
            className={cn(
              'text-sm font-bold tabular-nums shrink-0',
              homeWins ? 'text-primary' : 'text-foreground',
            )}
          >
            {node.match.home_score}
          </span>
        )}
      </div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2',
          awayWins && 'bg-primary-muted/50',
        )}
      >
        {node.away_team?.logo ? (
          <img src={node.away_team.logo} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-zinc-100 shrink-0" />
        )}
        <span
          className={cn(
            'text-sm flex-1 truncate',
            awayWins ? 'font-semibold text-foreground' : 'font-medium text-zinc-600',
          )}
        >
          {node.away_team?.name ?? 'TBD'}
        </span>
        {node.match != null && (
          <span
            className={cn(
              'text-sm font-bold tabular-nums shrink-0',
              awayWins ? 'text-primary' : 'text-foreground',
            )}
          >
            {node.match.away_score}
          </span>
        )}
      </div>
    </div>
  );
}

function BracketConnector({ matchCount }: { matchCount: number }) {
  const slots = Math.max(matchCount, 1);
  return (
    <div className="bracket-connector-col px-1" aria-hidden>
      {Array.from({ length: slots }).map((_, i) => (
        <div key={i} className="relative flex-1 flex items-center min-h-[52px]">
          <div className="absolute left-0 top-1/2 w-full h-px bg-border" />
          <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-border" />
        </div>
      ))}
    </div>
  );
}

interface BracketViewProps {
  nodes: BracketNode[];
}

export default function BracketView({ nodes }: BracketViewProps) {
  const stagesPresent = STAGE_ORDER.filter((s) => nodes.some((n) => n.stage === s));

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Trophy className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
        <p className="font-medium text-foreground">Bracket not yet generated</p>
        <p className="text-sm mt-1">Check back once knockout rounds are set.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex items-stretch gap-0 min-w-max mx-auto py-4">
        {stagesPresent.map((stage, stageIndex) => {
          const stageNodes = nodes
            .filter((n) => n.stage === stage)
            .sort((a, b) => a.position - b.position);

          return (
            <div key={stage} className="flex items-stretch">
              {stageIndex > 0 && (
                <BracketConnector matchCount={stageNodes.length} />
              )}
              <div className="bracket-round px-2">
                <h3 className="bracket-round-title">{STAGE_LABELS[stage]}</h3>
                <div
                  className="flex flex-col justify-around flex-1 gap-3"
                  style={{ minHeight: stageNodes.length > 1 ? `${stageNodes.length * 72}px` : undefined }}
                >
                  {stageNodes.map((node) => (
                    <BracketMatch key={node.id} node={node} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
