import { AnimatePresence, m } from 'motion/react';
import type { BracketNode, BracketStage, Team } from '@/types';
import { canManuallyPlaceInNode } from '@/lib/bracket-utils';
import { STAGE_LABELS, STAGE_ORDER } from './constants';
import { BracketConnector } from './BracketConnector';
import { BracketScrollArea } from './BracketScrollArea';
import { ChampionCard } from './ChampionCard';
import { MatchCard } from './MatchCard';
import type { DragState } from './types';

interface BracketTreeProps {
  nodes: BracketNode[];
  firstStage: string | null;
  structureLocked: boolean;
  resultsFrozen: boolean;
  adminBracketFinalized: boolean;
  matchDragId: string | null;
  matchDropId: string | null;
  dragOver: { nodeId: string; slot: 'home' | 'away' } | null;
  dragState: DragState | null;
  selectedTeamId: string | null;
  advancePending: boolean;
  onMatchDragStart: (nodeId: string) => void;
  onMatchDragOver: (nodeId: string) => void;
  onMatchDragLeave: () => void;
  onMatchDragEnd: () => void;
  onMatchDrop: (nodeIdA: string, nodeIdB: string) => void;
  onDragStartFromSlot: (team: Team, from: { nodeId: string; slot: 'home' | 'away' }, e: React.DragEvent) => void;
  onDragOverSlot: (nodeId: string, slot: 'home' | 'away') => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, nodeId: string, slot: 'home' | 'away') => void;
  onSlotClick: (node: BracketNode, slot: 'home' | 'away') => void;
  onRemoveSlot: (node: BracketNode, slot: 'home' | 'away') => void;
  onAdvance: (node: BracketNode, winnerId: string) => void;
}

export function BracketTree({
  nodes,
  firstStage,
  structureLocked,
  resultsFrozen,
  adminBracketFinalized,
  matchDragId,
  matchDropId,
  dragOver,
  dragState,
  selectedTeamId,
  advancePending,
  onMatchDragStart,
  onMatchDragOver,
  onMatchDragLeave,
  onMatchDragEnd,
  onMatchDrop,
  onDragStartFromSlot,
  onDragOverSlot,
  onDragLeave,
  onDrop,
  onSlotClick,
  onRemoveSlot,
  onAdvance,
}: BracketTreeProps) {
  const presentStages = STAGE_ORDER.filter((stage) => nodes.some((n) => n.stage === stage));
  const mainStages = presentStages.filter((s) => s !== 'THIRD_PLACE');
  const thirdPlaceStage = presentStages.includes('THIRD_PLACE') ? 'THIRD_PLACE' : null;

  const maxInRound = Math.max(
    ...mainStages.map((s) => nodes.filter((n) => n.stage === s).length),
    1,
  );
  const roundMinHeight = maxInRound * 128;

  const finalNode = nodes.find((n) => n.stage === 'FINAL');
  let champion: Team | null = null;
  if (finalNode?.winner_id) {
    champion =
      finalNode.winner_id === finalNode.home_team_id
        ? finalNode.home_team ?? null
        : finalNode.away_team ?? null;
  }

  const renderRound = (stage: BracketStage, stageIndex: number) => {
    const stageNodes = nodes.filter((n) => n.stage === stage).sort((a, b) => a.position - b.position);

    return (
      <div key={stage} className="flex items-stretch">
        {stageIndex > 0 && <BracketConnector slotCount={stageNodes.length} />}
        <div className="bracket-round px-2 sm:px-3">
          <h3 className="bracket-round-title sticky top-0 z-[var(--z-sticky)] bg-[hsl(var(--surface-muted))]/95 py-1 backdrop-blur-sm">
            {STAGE_LABELS[stage]}
          </h3>
          <div className="flex flex-col justify-around gap-4 flex-1" style={{ minHeight: roundMinHeight }}>
            <AnimatePresence mode="popLayout">
              {stageNodes.map((node) => (
                <m.div key={node.id} layout className="flex items-center flex-1 min-h-[112px]">
                  <MatchCard
                    node={node}
                    firstStage={firstStage}
                    structureLocked={structureLocked}
                    resultsFrozen={resultsFrozen}
                    allowPlacement={canManuallyPlaceInNode(node, firstStage)}
                    canSwapMatch={
                      !structureLocked && !!firstStage && node.stage === firstStage && !node.winner_id
                    }
                    matchDragId={matchDragId}
                    matchDropId={matchDropId}
                    dragOver={dragOver}
                    dragState={dragState}
                    selectedTeamId={selectedTeamId}
                    advancePending={advancePending}
                    onMatchDragStart={onMatchDragStart}
                    onMatchDragOver={onMatchDragOver}
                    onMatchDragLeave={onMatchDragLeave}
                    onMatchDragEnd={onMatchDragEnd}
                    onMatchDrop={onMatchDrop}
                    onDragStartFromSlot={onDragStartFromSlot}
                    onDragOverSlot={onDragOverSlot}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onSlotClick={onSlotClick}
                    onRemoveSlot={onRemoveSlot}
                    onAdvance={onAdvance}
                  />
                </m.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-lg border border-border/80 bg-[hsl(var(--surface-muted))] p-4 shadow-[var(--shadow-sm)] sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Knockout bracket</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Place teams in the first round, then click and confirm winners to advance through the tree.
        </p>
      </div>

      <BracketScrollArea>
        <div className="bracket-shell border-0 bg-transparent p-0 shadow-none">
          <div className="bracket-track items-stretch gap-1">
            {mainStages.map((stage, stageIndex) => renderRound(stage, stageIndex))}

            {mainStages.length > 0 && <BracketConnector slotCount={1} />}
            <div className="flex flex-col justify-center px-2">
              <ChampionCard champion={champion} finalized={adminBracketFinalized} />
            </div>

            {thirdPlaceStage && (
              <>
                <div className="w-6 shrink-0" aria-hidden />
                {renderRound(thirdPlaceStage, 0)}
              </>
            )}
          </div>
        </div>
      </BracketScrollArea>
    </section>
  );
}
