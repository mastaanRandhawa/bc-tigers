import { Link } from 'react-router-dom';
import type { BracketNode } from '@/types';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import { getMatchPath } from '@/lib/division-routes';

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

function BracketTeamRow({
  name,
  logo,
  score,
  isWinner,
}: {
  name: string;
  logo?: string | null;
  score?: number;
  isWinner: boolean;
}) {
  return (
    <div
      className={cn(
        'bracket-match-row',
        isWinner && 'bg-zinc-50',
      )}
    >
      {logo ? (
        <img src={logo} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-border" />
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full bg-zinc-100 ring-1 ring-border" />
      )}
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-sm',
          isWinner ? 'font-semibold text-foreground' : 'font-medium text-zinc-600',
        )}
      >
        {name}
      </span>
      {score !== undefined && (
        <span
          className={cn(
            'shrink-0 text-sm font-bold tabular-nums',
            isWinner ? 'text-primary' : 'text-foreground',
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function BracketMatch({ node }: BracketMatchProps) {
  const isFinal = node.stage === 'FINAL';
  const homeWins = node.winner_id === node.home_team_id;
  const awayWins = node.winner_id === node.away_team_id;
  const matchPath = node.match ? getMatchPath(node.match) : null;

  const inner = (
    <div className={cn('bracket-match', isFinal && 'bracket-match-final')}>
      <BracketTeamRow
        name={node.home_team?.name ?? 'TBD'}
        logo={node.home_team?.logo}
        score={node.match?.home_score}
        isWinner={homeWins}
      />
      <BracketTeamRow
        name={node.away_team?.name ?? 'TBD'}
        logo={node.away_team?.logo}
        score={node.match?.away_score}
        isWinner={awayWins}
      />
      {isFinal && (
        <div className="flex items-center justify-center gap-1 border-t border-border bg-primary-muted/40 px-2 py-1">
          <Trophy className="h-3 w-3 text-primary" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Final</span>
        </div>
      )}
    </div>
  );

  if (matchPath) {
    return (
      <Link to={matchPath} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
        {inner}
      </Link>
    );
  }

  return inner;
}

function BracketConnector({ slotCount }: { slotCount: number }) {
  const pairs = Math.max(Math.ceil(slotCount / 2), 1);

  return (
    <div className="bracket-connector-col" aria-hidden>
      {Array.from({ length: pairs }).map((_, i) => (
        <div key={i} className="bracket-connector-slot">
          <div className="bracket-connector-h" />
          <div className="bracket-connector-v" />
          <div className="bracket-connector-bracket" />
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
      <div className="py-10 text-center">
        <Trophy className="mx-auto mb-3 h-9 w-9 text-zinc-300" aria-hidden />
        <p className="font-medium text-foreground">Bracket not yet generated</p>
        <p className="mt-1 text-sm text-zinc-500">Check back once knockout rounds are set.</p>
      </div>
    );
  }

  const maxInRound = Math.max(
    ...stagesPresent.map((s) => nodes.filter((n) => n.stage === s).length),
    1,
  );
  const rowHeight = 44;
  const roundMinHeight = maxInRound * rowHeight * 2;

  return (
    <div className="overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
      <div className="bracket-shell">
        <div className="bracket-track">
          {stagesPresent.map((stage, stageIndex) => {
            const stageNodes = nodes
              .filter((n) => n.stage === stage)
              .sort((a, b) => a.position - b.position);

            return (
              <div key={stage} className="flex items-stretch">
                {stageIndex > 0 && <BracketConnector slotCount={stageNodes.length} />}
                <div className="bracket-round px-1.5 sm:px-2">
                  <h3 className="bracket-round-title">{STAGE_LABELS[stage]}</h3>
                  <div
                    className="flex flex-col justify-around gap-2 flex-1"
                    style={{ minHeight: roundMinHeight }}
                  >
                    {stageNodes.map((node) => (
                      <div key={node.id} className="flex items-center flex-1 min-h-[72px]">
                        <BracketMatch node={node} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
