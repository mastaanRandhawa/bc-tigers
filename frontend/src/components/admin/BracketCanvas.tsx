import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { m, AnimatePresence } from 'motion/react';
import {
  useBracket,
  useGenerateBracket,
  useRandomizeBracket,
  useAdvanceBracket,
  usePlaceBracketTeam,
  useRestoreBracket,
  useSetBracketLock,
  useSwapBracketMatches,
  useAssignBracketTeams,
  useValidateBracket,
} from '@/hooks/useBrackets';
import { standingsService } from '@/services/standings.service';
import { Button } from '@/components/ui/button';
import QueryState from '@/components/shared/QueryState';
import { BracketGenerateSheet, BracketEmptyState } from '@/components/admin/BracketGenerateSheet';
import { BracketTeamPool } from '@/components/admin/BracketTeamPool';
import { getApiErrorMessage } from '@/lib/errors';
import {
  isBracketLocked,
  isByeSlot,
  snapshotFromNodes,
  earliestStage,
  configureTeamDrag,
  configureMatchDrag,
  readTeamDragId,
  readMatchDragId,
  computeStandardSeedByTeamId,
  type BracketSeeding,
  type BracketSnapshot,
} from '@/lib/bracket-utils';
import {
  GitBranch,
  Trophy,
  Shuffle,
  Undo2,
  Redo2,
  Lock,
  MousePointerClick,
  GripVertical,
  Unlock,
} from 'lucide-react';
import type { BracketNode, BracketStage, Team } from '@/types';

const STAGE_ORDER: BracketStage[] = [
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_PLACE',
  'FINAL',
];

const STAGE_LABELS: Record<BracketStage, string> = {
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINAL: 'Quarter Finals',
  SEMI_FINAL: 'Semi Finals',
  THIRD_PLACE: '3rd Place',
  FINAL: 'Final',
};

interface BracketCanvasProps {
  divisionId: string;
  divisionSlug: string;
  teams?: Team[];
  adminBracketLocked?: boolean;
}

interface DragState {
  teamId: string;
  teamName: string;
  from?: { nodeId: string; slot: 'home' | 'away' };
}

export function BracketCanvas({
  divisionId,
  divisionSlug,
  teams = [],
  adminBracketLocked = false,
}: BracketCanvasProps) {
  const { data: nodes = [], isLoading, isError, refetch } = useBracket(divisionId);
  const generateMutation = useGenerateBracket();
  const randomizeMutation = useRandomizeBracket();
  const advanceMutation = useAdvanceBracket();
  const placeMutation = usePlaceBracketTeam();
  const restoreMutation = useRestoreBracket();
  const lockMutation = useSetBracketLock();
  const swapMutation = useSwapBracketMatches();
  const assignMutation = useAssignBracketTeams();

  const [showGenerate, setShowGenerate] = useState(false);

  const { data: standings = [] } = useQuery({
    queryKey: ['standings', divisionId],
    queryFn: async () => (await standingsService.getByDivision(divisionId)).data,
    enabled: !!divisionId,
  });

  const seedByTeamId = useMemo(
    () => computeStandardSeedByTeamId(teams, standings),
    [teams, standings],
  );

  const { data: bracketValidation } = useValidateBracket(showGenerate ? divisionId : undefined);
  const [dragOver, setDragOver] = useState<{ nodeId: string; slot: 'home' | 'away' } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [matchDragId, setMatchDragId] = useState<string | null>(null);
  const [matchDropId, setMatchDropId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [undoStack, setUndoStack] = useState<BracketSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<BracketSnapshot[]>([]);
  const [randomizing, setRandomizing] = useState(false);

  const matchActivityLocked = isBracketLocked(nodes);
  const locked = adminBracketLocked || matchActivityLocked;
  const firstStage = earliestStage(nodes, STAGE_ORDER);

  const assignedTeamIds = new Set<string>();
  for (const node of nodes) {
    if (node.home_team_id) assignedTeamIds.add(node.home_team_id);
    if (node.away_team_id) assignedTeamIds.add(node.away_team_id);
  }

  const presentStages = STAGE_ORDER.filter((stage) => nodes.some((n) => n.stage === stage));

  const pushHistory = useCallback(() => {
    if (nodes.length === 0) return;
    setUndoStack((prev) => [...prev, snapshotFromNodes(nodes)].slice(-40));
    setRedoStack([]);
  }, [nodes]);

  const applySnapshot = async (snapshot: BracketSnapshot) => {
    await restoreMutation.mutateAsync({ divisionId, snapshot });
  };

  const undo = async () => {
    const prev = undoStack[undoStack.length - 1];
    if (!prev || locked) return;
    setError('');
    try {
      const current = snapshotFromNodes(nodes);
      setUndoStack((s) => s.slice(0, -1));
      setRedoStack((s) => [...s, current]);
      await applySnapshot(prev);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Undo failed'));
    }
  };

  const redo = async () => {
    const next = redoStack[redoStack.length - 1];
    if (!next || locked) return;
    setError('');
    try {
      const current = snapshotFromNodes(nodes);
      setRedoStack((s) => s.slice(0, -1));
      setUndoStack((s) => [...s, current]);
      await applySnapshot(next);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Redo failed'));
    }
  };

  const startDrag = (
    team: Team,
    from?: { nodeId: string; slot: 'home' | 'away' },
    e?: React.DragEvent,
  ) => {
    if (locked) return;
    if (e) configureTeamDrag(e.nativeEvent, team.id);
    setDragState({ teamId: team.id, teamName: team.name, from });
    setSelectedTeam(null);
    setMatchDragId(null);
  };

  const placeTeam = async (nodeId: string, slot: 'home' | 'away', teamId: string) => {
    if (locked) return;
    pushHistory();
    setError('');
    try {
      await placeMutation.mutateAsync({ nodeId, teamId, slot });
      setSelectedTeam(null);
      setDragState(null);
      setDragOver(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to place team'));
    }
  };

  const handleDrop = async (e: React.DragEvent, nodeId: string, slot: 'home' | 'away') => {
    if (locked || readMatchDragId(e.nativeEvent)) return;
    e.preventDefault();
    e.stopPropagation();
    const teamId = dragState?.teamId ?? readTeamDragId(e.nativeEvent);
    if (!teamId) return;
    await placeTeam(nodeId, slot, teamId);
  };

  const handleSlotClick = async (node: BracketNode, slot: 'home' | 'away') => {
    if (!selectedTeam || locked || node.winner_id) return;
    if (isByeSlot(node, slot)) return;
    await placeTeam(node.id, slot, selectedTeam.id);
  };

  const handlePoolClick = (team: Team, multi: boolean) => {
    if (locked) return;
    if (multi) {
      setSelectedTeamIds((prev) => {
        const next = new Set(prev);
        if (next.has(team.id)) next.delete(team.id);
        else next.add(team.id);
        return next;
      });
      setSelectedTeam(null);
    } else {
      setSelectedTeam((prev) => (prev?.id === team.id ? null : { id: team.id, name: team.name }));
      setSelectedTeamIds(new Set());
    }
    setDragState(null);
  };

  const handleRemoveSelected = async (teamIds: string[]) => {
    if (locked || teamIds.length === 0) return;
    pushHistory();
    const removeSet = new Set(teamIds);
    const snap = snapshotFromNodes(nodes).map((s) => {
      const node = nodes.find((n) => n.id === s.id)!;
      return {
        ...s,
        home_team_id: node.home_team_id && removeSet.has(node.home_team_id) ? null : s.home_team_id,
        away_team_id: node.away_team_id && removeSet.has(node.away_team_id) ? null : s.away_team_id,
        winner_id: null,
      };
    });
    try {
      await restoreMutation.mutateAsync({ divisionId, snapshot: snap });
      setSelectedTeamIds(new Set());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to remove teams'));
    }
  };

  const handleRandomizeSelected = async (teamIds: string[]) => {
    if (locked || teamIds.length === 0) return;
    pushHistory();
    setRandomizing(true);
    try {
      await assignMutation.mutateAsync({ divisionId, teamIds });
      setSelectedTeamIds(new Set());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to assign teams'));
    } finally {
      setTimeout(() => setRandomizing(false), 500);
    }
  };

  const handleToggleLock = async () => {
    if (matchActivityLocked && adminBracketLocked) {
      setError('Cannot unlock — matches have already started');
      return;
    }
    setError('');
    try {
      await lockMutation.mutateAsync({ divisionId, locked: !adminBracketLocked });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update bracket lock'));
    }
  };

  const handleSwapMatches = async (nodeIdA: string, nodeIdB: string) => {
    if (locked) return;
    pushHistory();
    setError('');
    try {
      await swapMutation.mutateAsync({ nodeIdA, nodeIdB });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to swap matches'));
    }
    setMatchDragId(null);
    setMatchDropId(null);
  };

  const handleRemove = async (node: BracketNode, slot: 'home' | 'away') => {
    if (locked) return;
    pushHistory();
    setError('');
    const snap = snapshotFromNodes(nodes).map((s) =>
      s.id === node.id
        ? {
            ...s,
            [slot === 'home' ? 'home_team_id' : 'away_team_id']: null,
            winner_id: null,
          }
        : s,
    );
    try {
      await restoreMutation.mutateAsync({ divisionId, snapshot: snap });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to remove team'));
    }
  };

  const handleAdvance = async (node: BracketNode, winnerId: string) => {
    pushHistory();
    setError('');
    try {
      await advanceMutation.mutateAsync({ nodeId: node.id, winnerId });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to advance winner'));
    }
  };

  const handleGenerate = async (seeding: BracketSeeding) => {
    setError('');
    try {
      await generateMutation.mutateAsync({ divisionId, seeding });
      setUndoStack([]);
      setRedoStack([]);
      setShowGenerate(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to generate bracket'));
    }
  };

  const handleRandomize = async () => {
    if (locked) return;
    pushHistory();
    setRandomizing(true);
    setError('');
    try {
      await randomizeMutation.mutateAsync(divisionId);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Random draw failed'));
    } finally {
      setTimeout(() => setRandomizing(false), 600);
    }
  };

  const busy =
    generateMutation.isPending ||
    randomizeMutation.isPending ||
    placeMutation.isPending ||
    advanceMutation.isPending ||
    restoreMutation.isPending ||
    lockMutation.isPending ||
    swapMutation.isPending ||
    assignMutation.isPending;

  return (
    <div className="space-y-4">
      {locked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          {matchActivityLocked
            ? 'Bracket locked — matches have started. Scores can still be updated from match pages.'
            : 'Bracket locked by admin — unlock to edit placements.'}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()} isEmpty={false}>
        {nodes.length === 0 ? (
          <BracketEmptyState teamCount={teams.length} onCreate={() => setShowGenerate(true)} />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <p className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2 min-w-[200px] flex-1">
                <MousePointerClick className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <span>
                  Drag or <strong className="font-medium text-foreground">click team → click slot</strong>.
                  Drop on a team to swap. Drag match handles to swap fixtures. Ctrl+click for bulk select.
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Button variant="outline" size="sm" onClick={undo} disabled={locked || undoStack.length === 0 || busy}>
                  <Undo2 className="h-3.5 w-3.5 mr-1" /> Undo
                </Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={locked || redoStack.length === 0 || busy}>
                  <Redo2 className="h-3.5 w-3.5 mr-1" /> Redo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRandomize}
                  disabled={locked || busy}
                  className={randomizing ? 'animate-pulse' : ''}
                >
                  <Shuffle className="h-3.5 w-3.5 mr-1" />
                  Random draw
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleLock}
                  disabled={matchActivityLocked || lockMutation.isPending || busy}
                  title={
                    matchActivityLocked
                      ? 'Cannot change lock — matches have started'
                      : adminBracketLocked
                      ? 'Unlock bracket for editing'
                      : 'Lock bracket to prevent edits'
                  }
                >
                  {adminBracketLocked ? (
                    <>
                      <Unlock className="h-3.5 w-3.5 mr-1" /> Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 mr-1" /> Lock
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowGenerate(true)} disabled={busy}>
                  <GitBranch className="h-3.5 w-3.5 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>

            <BracketTeamPool
              teams={teams}
              seedByTeamId={seedByTeamId}
              assignedTeamIds={assignedTeamIds}
              selectedTeamId={selectedTeam?.id ?? null}
              selectedTeamIds={selectedTeamIds}
              dragTeamId={dragState?.teamId ?? null}
              locked={locked}
              busy={busy}
              onSelectTeam={handlePoolClick}
              onDragStart={(team, e) => startDrag(team, undefined, e)}
              onDragEnd={() => setDragState(null)}
              onRandomizeSelected={handleRandomizeSelected}
              onRemoveSelected={handleRemoveSelected}
              onClearSelection={() => setSelectedTeamIds(new Set())}
            />

            <div className="overflow-x-auto overscroll-x-contain rounded-lg">
              <div className="flex gap-5 min-w-max pb-4">
                {presentStages.map((stage) => {
                  const stageNodes = nodes
                    .filter((n) => n.stage === stage)
                    .sort((a, b) => a.position - b.position);

                  return (
                    <div key={stage} className="flex flex-col gap-3" style={{ minWidth: 228 }}>
                      <div className="flex items-center gap-2">
                        {stage === 'FINAL' && <Trophy className="h-4 w-4 text-amber-500" />}
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {STAGE_LABELS[stage]}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <AnimatePresence mode="popLayout">
                          {stageNodes.map((node) => (
                            <m.div
                              key={node.id}
                              layout
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <BracketNodeCard
                                node={node}
                                locked={locked}
                                canSwapMatch={
                                  !locked &&
                                  !!firstStage &&
                                  node.stage === firstStage &&
                                  !node.winner_id
                                }
                                matchDragId={matchDragId}
                                matchDropId={matchDropId}
                                dragOver={dragOver}
                                dragState={dragState}
                                selectedTeamId={selectedTeam?.id ?? null}
                                onMatchDragStart={(nodeId) => setMatchDragId(nodeId)}
                                onMatchDragOver={(nodeId) => setMatchDropId(nodeId)}
                                onMatchDragLeave={() => setMatchDropId(null)}
                                onMatchDragEnd={() => {
                                  setMatchDragId(null);
                                  setMatchDropId(null);
                                }}
                                onMatchDrop={(nodeIdA, nodeIdB) => handleSwapMatches(nodeIdA, nodeIdB)}
                                onDragStartFromSlot={(team, from, e) => startDrag(team, from, e)}
                                onDragOverSlot={(nodeId, slot) => {
                                  if (!locked && dragState && !matchDragId) {
                                    setDragOver({ nodeId, slot });
                                  }
                                }}
                                onDragLeave={() => setDragOver(null)}
                                onDrop={handleDrop}
                                onSlotClick={handleSlotClick}
                                onRemoveSlot={handleRemove}
                                onAdvance={handleAdvance}
                                advancePending={advanceMutation.isPending}
                              />
                            </m.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </QueryState>

      <BracketGenerateSheet
        open={showGenerate}
        onOpenChange={setShowGenerate}
        teamCount={bracketValidation?.eligibleCount ?? teams.length}
        validation={bracketValidation}
        isRegenerate={nodes.length > 0}
        pending={generateMutation.isPending}
        onGenerate={handleGenerate}
      />
    </div>
  );
}

interface BracketNodeCardProps {
  node: BracketNode;
  locked: boolean;
  canSwapMatch: boolean;
  matchDragId: string | null;
  matchDropId: string | null;
  dragOver: { nodeId: string; slot: 'home' | 'away' } | null;
  dragState: DragState | null;
  selectedTeamId: string | null;
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
  advancePending: boolean;
}

function BracketNodeCard({
  node,
  locked,
  canSwapMatch,
  matchDragId,
  matchDropId,
  dragOver,
  dragState,
  selectedTeamId,
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
  advancePending,
}: BracketNodeCardProps) {
  const canAdvance =
    !!(node.home_team_id && node.away_team_id && !node.winner_id) &&
    !isByeSlot(node, 'home') &&
    !isByeSlot(node, 'away');
  const isDecided = !!node.winner_id;
  const isMatchDragging = matchDragId === node.id;
  const isMatchDropTarget = matchDropId === node.id && matchDragId !== node.id;

  return (
    <div
      className={`rounded-lg border bg-card shadow-sm overflow-hidden ${
        isDecided ? 'border-primary/30' : 'border-border'
      } ${isMatchDropTarget ? 'ring-2 ring-primary/40' : ''} ${isMatchDragging ? 'opacity-60' : ''}`}
      onDragOver={
        canSwapMatch && matchDragId && matchDragId !== node.id && !dragState
          ? (e) => {
              e.preventDefault();
              if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
              onMatchDragOver(node.id);
            }
          : undefined
      }
      onDragLeave={canSwapMatch && !dragState ? onMatchDragLeave : undefined}
      onDrop={
        canSwapMatch && matchDragId && matchDragId !== node.id && !dragState
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onMatchDrop(matchDragId, node.id);
            }
          : undefined
      }
    >
      {canSwapMatch && (
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            configureMatchDrag(e.nativeEvent, node.id);
            onMatchDragStart(node.id);
          }}
          onDragEnd={() => onMatchDragEnd()}
          className="flex cursor-grab items-center justify-center gap-1 border-b border-border bg-muted/40 py-0.5 text-[10px] text-muted-foreground active:cursor-grabbing"
          title="Drag to swap with another match in this round"
        >
          <GripVertical className="h-3 w-3" />
          Swap match
        </div>
      )}
      <TeamSlot
        node={node}
        slot="home"
        team={node.home_team}
        locked={locked}
        isOver={dragOver?.nodeId === node.id && dragOver.slot === 'home'}
        isDragging={!!dragState}
        isClickTarget={!!selectedTeamId && !node.winner_id && !isByeSlot(node, 'home')}
        isWinner={node.winner_id === node.home_team_id}
        onDragStartFromSlot={onDragStartFromSlot}
        onDragOver={(e) => {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          onDragOverSlot(node.id, 'home');
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, node.id, 'home')}
        onClick={() => onSlotClick(node, 'home')}
        onRemove={node.home_team && !locked && !node.winner_id ? () => onRemoveSlot(node, 'home') : undefined}
      />

      {node.match ? (
        <div className="flex justify-center border-y border-border bg-muted/40 py-1 text-xs font-bold">
          {node.match.home_score} – {node.match.away_score}
        </div>
      ) : (
        <div className="border-y border-border" />
      )}

      <TeamSlot
        node={node}
        slot="away"
        team={node.away_team}
        locked={locked}
        isOver={dragOver?.nodeId === node.id && dragOver.slot === 'away'}
        isDragging={!!dragState}
        isClickTarget={!!selectedTeamId && !node.winner_id && !isByeSlot(node, 'away')}
        isWinner={node.winner_id === node.away_team_id}
        onDragStartFromSlot={onDragStartFromSlot}
        onDragOver={(e) => {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          onDragOverSlot(node.id, 'away');
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, node.id, 'away')}
        onClick={() => onSlotClick(node, 'away')}
        onRemove={node.away_team && !locked && !node.winner_id ? () => onRemoveSlot(node, 'away') : undefined}
      />

      {canAdvance && !locked && (
        <div className="border-t border-border bg-muted/30 p-2 flex gap-1.5">
          <p className="text-[10px] text-muted-foreground self-center mr-1">Winner:</p>
          {[node.home_team, node.away_team].map(
            (t) =>
              t && (
                <Button
                  key={t.id}
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] flex-1 truncate"
                  onClick={() => onAdvance(node, t.id)}
                  disabled={advancePending}
                >
                  {t.name}
                </Button>
              ),
          )}
        </div>
      )}

      {isDecided && (
        <div className="border-t border-border bg-primary/5 px-3 py-1.5">
          <p className="text-[10px] font-semibold text-primary">
            Winner:{' '}
            {node.winner_id === node.home_team_id ? node.home_team?.name : node.away_team?.name}
          </p>
        </div>
      )}
    </div>
  );
}

interface TeamSlotProps {
  node: BracketNode;
  slot: 'home' | 'away';
  team?: Team | null;
  locked: boolean;
  isOver: boolean;
  isDragging: boolean;
  isClickTarget: boolean;
  isWinner: boolean;
  onDragStartFromSlot: (team: Team, from: { nodeId: string; slot: 'home' | 'away' }, e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onRemove?: () => void;
}

function TeamSlot({
  node,
  slot,
  team,
  locked,
  isOver,
  isDragging,
  isClickTarget,
  isWinner,
  onDragStartFromSlot,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onRemove,
}: TeamSlotProps) {
  const bye = isByeSlot(node, slot);

  return (
    <div
      role="button"
      tabIndex={isClickTarget ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`flex items-center justify-between gap-2 px-3 py-2 min-h-[38px] transition-all duration-150 ${
        isOver
          ? 'bg-primary/15 ring-1 ring-primary/50'
          : isClickTarget
          ? 'bg-primary/5 ring-1 ring-primary/40 cursor-pointer'
          : isDragging && !team && !bye
          ? 'bg-muted/60 border-dashed'
          : ''
      } ${isWinner ? 'bg-primary/5' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={isClickTarget ? onClick : undefined}
    >
      {bye ? (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 italic">
          BYE — auto-advance
        </span>
      ) : team ? (
        <>
          <div
            className="flex items-center gap-2 min-w-0 flex-1"
            draggable={!locked && !isWinner}
            onDragStart={(e) => {
              e.stopPropagation();
              onDragStartFromSlot(team, { nodeId: node.id, slot }, e);
            }}
          >
            {team.logo ? (
              <img src={team.logo} alt="" className="h-5 w-5 rounded object-cover shrink-0" />
            ) : (
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: team.primary_color ?? '#94a3b8' }}
              />
            )}
            <span
              className={`text-xs font-medium truncate cursor-grab active:cursor-grabbing ${
                isWinner ? 'text-primary font-semibold' : 'text-foreground'
              }`}
            >
              {team.name}
            </span>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-muted-foreground hover:text-destructive text-sm shrink-0 px-1"
              title="Remove from slot"
            >
              ×
            </button>
          )}
        </>
      ) : (
        <span
          className={`text-[11px] italic ${
            isOver || isClickTarget ? 'text-primary font-medium' : 'text-muted-foreground/60'
          }`}
        >
          {isOver ? 'Release to place' : isClickTarget ? 'Click to place team' : 'Empty slot'}
        </span>
      )}
    </div>
  );
}
