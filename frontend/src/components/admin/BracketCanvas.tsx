import { useState } from 'react';
import { useBracket, useGenerateBracket, useAdvanceBracket, useUpdateBracketNode } from '@/hooks/useBrackets';
import { Button } from '@/components/ui/button';
import QueryState from '@/components/shared/QueryState';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/errors';
import { GitBranch, Trophy, ArrowRight, MousePointerClick } from 'lucide-react';
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
}

interface DragState {
  teamId: string;
  teamName: string;
}

export function BracketCanvas({ divisionId, divisionSlug, teams = [] }: BracketCanvasProps) {
  const { data: nodes = [], isLoading, isError, refetch } = useBracket(divisionSlug);
  const generateMutation = useGenerateBracket();
  const advanceMutation = useAdvanceBracket();
  const updateNodeMutation = useUpdateBracketNode();

  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [dragOver, setDragOver] = useState<{ nodeId: string; slot: 'home' | 'away' } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null);
  const [advanceError, setAdvanceError] = useState('');

  const allAssignedTeamIds = new Set<string>();
  for (const node of nodes) {
    if (node.home_team_id) allAssignedTeamIds.add(node.home_team_id);
    if (node.away_team_id) allAssignedTeamIds.add(node.away_team_id);
  }
  const poolTeams = teams.filter((t) => !allAssignedTeamIds.has(t.id));

  const presentStages = STAGE_ORDER.filter((stage) =>
    nodes.some((n) => n.stage === stage),
  );

  const handleDragStart = (team: Team) => {
    setDragState({ teamId: team.id, teamName: team.name });
  };

  const assignTeamToSlot = async (nodeId: string, slot: 'home' | 'away', teamId: string) => {
    try {
      await updateNodeMutation.mutateAsync({
        nodeId,
        data: slot === 'home' ? { home_team_id: teamId } : { away_team_id: teamId },
      });
      setSelectedTeam(null);
      setDragState(null);
    } catch (err) {
      setAdvanceError(getApiErrorMessage(err, 'Failed to assign team'));
    }
  };

  const handleDrop = async (nodeId: string, slot: 'home' | 'away') => {
    if (!dragState) return;
    setDragOver(null);
    await assignTeamToSlot(nodeId, slot, dragState.teamId);
  };

  const handleSlotClick = async (node: BracketNode, slot: 'home' | 'away') => {
    if (!selectedTeam) return;
    const occupied = slot === 'home' ? node.home_team_id : node.away_team_id;
    if (occupied === selectedTeam.id) {
      setSelectedTeam(null);
      return;
    }
    await assignTeamToSlot(node.id, slot, selectedTeam.id);
  };

  const handlePoolTeamClick = (team: Team) => {
    setSelectedTeam((prev) => (prev?.id === team.id ? null : { id: team.id, name: team.name }));
    setDragState(null);
  };

  const handleRemoveSlot = async (node: BracketNode, slot: 'home' | 'away') => {
    try {
      await updateNodeMutation.mutateAsync({
        nodeId: node.id,
        data: slot === 'home' ? { home_team_id: null } : { away_team_id: null },
      });
    } catch (err) {
      setAdvanceError(getApiErrorMessage(err, 'Failed to remove team'));
    }
  };

  const handleAdvance = async (node: BracketNode, winnerId: string) => {
    setAdvanceError('');
    try {
      await advanceMutation.mutateAsync({ nodeId: node.id, winnerId });
    } catch (err) {
      setAdvanceError(getApiErrorMessage(err, 'Failed to advance winner'));
    }
  };

  return (
    <div className="space-y-6">
      {advanceError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {advanceError}
        </p>
      )}

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={false}
      >
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">No bracket generated yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Generate a bracket from current standings to get started.
              </p>
            </div>
            <Button onClick={() => setShowGenerateConfirm(true)} disabled={generateMutation.isPending}>
              <GitBranch className="mr-1.5 h-4 w-4" />
              Generate Bracket
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <MousePointerClick className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <span>
                  Drag teams into slots, or <strong className="font-medium text-foreground">click a team</strong> then{' '}
                  <strong className="font-medium text-foreground">click an empty slot</strong>. Use winner buttons to advance.
                </span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGenerateConfirm(true)}
                disabled={generateMutation.isPending}
                className="self-start sm:self-auto"
              >
                Regenerate
              </Button>
            </div>

            {/* Team Pool */}
            {poolTeams.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Unseeded Teams
                  {selectedTeam && (
                    <span className="ml-2 normal-case font-normal text-primary">
                      · {selectedTeam.name} selected — click a slot
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {poolTeams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      draggable
                      onDragStart={() => {
                        handleDragStart(team);
                        setSelectedTeam(null);
                      }}
                      onDragEnd={() => setDragState(null)}
                      onClick={() => handlePoolTeamClick(team)}
                      className={`flex cursor-grab items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:border-primary/40 active:cursor-grabbing select-none transition-colors ${
                        selectedTeam?.id === team.id
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border'
                      }`}
                      style={{ borderLeftColor: team.primary_color ?? undefined, borderLeftWidth: 3 }}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bracket stages — horizontally scrollable; overscroll-x-contain prevents page scroll bleed on mobile */}
            <p className="text-xs text-muted-foreground sm:hidden mb-2">
              Scroll left/right to view all stages.
            </p>
            <div className="overflow-x-auto overscroll-x-contain rounded-lg">
              <div className="flex gap-6 min-w-max pb-4">
                {presentStages.map((stage, stageIdx) => {
                  const stageNodes = nodes
                    .filter((n) => n.stage === stage)
                    .sort((a, b) => a.position - b.position);

                  return (
                    <div key={stage} className="flex flex-col gap-4" style={{ minWidth: 220 }}>
                      <div className="flex items-center gap-2">
                        {stage === 'FINAL' && <Trophy className="h-4 w-4 text-amber-500" />}
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {STAGE_LABELS[stage]}
                        </p>
                      </div>

                      <div className="flex flex-col justify-around flex-1 gap-3">
                        {stageNodes.map((node) => (
                          <BracketNodeCard
                            key={node.id}
                            node={node}
                            dragOver={dragOver}
                            dragState={dragState}
                            selectedTeamId={selectedTeam?.id ?? null}
                            onDragOverSlot={(nodeId, slot) => setDragOver({ nodeId, slot })}
                            onDragLeave={() => setDragOver(null)}
                            onDrop={handleDrop}
                            onSlotClick={handleSlotClick}
                            onRemoveSlot={handleRemoveSlot}
                            onAdvance={handleAdvance}
                            advancePending={advanceMutation.isPending}
                          />
                        ))}
                      </div>

                      {stageIdx < presentStages.length - 1 && (
                        <div className="absolute" style={{ display: 'none' }}>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </QueryState>

      <ConfirmDialog
        open={showGenerateConfirm}
        onOpenChange={setShowGenerateConfirm}
        title={nodes.length > 0 ? 'Regenerate bracket?' : 'Generate bracket?'}
        description={
          nodes.length > 0
            ? 'This will delete the current bracket and rebuild from standings. This cannot be undone.'
            : 'Generate bracket from current division standings.'
        }
        confirmLabel="Generate"
        onConfirm={async () => {
          try {
            await generateMutation.mutateAsync(divisionId);
            setShowGenerateConfirm(false);
            setAdvanceError('');
          } catch (err) {
            setAdvanceError(getApiErrorMessage(err, 'Failed to generate bracket'));
          }
        }}
      />
    </div>
  );
}

interface BracketNodeCardProps {
  node: BracketNode;
  dragOver: { nodeId: string; slot: 'home' | 'away' } | null;
  dragState: DragState | null;
  selectedTeamId: string | null;
  onDragOverSlot: (nodeId: string, slot: 'home' | 'away') => void;
  onDragLeave: () => void;
  onDrop: (nodeId: string, slot: 'home' | 'away') => void;
  onSlotClick: (node: BracketNode, slot: 'home' | 'away') => void;
  onRemoveSlot: (node: BracketNode, slot: 'home' | 'away') => void;
  onAdvance: (node: BracketNode, winnerId: string) => void;
  advancePending: boolean;
}

function BracketNodeCard({
  node,
  dragOver,
  dragState,
  selectedTeamId,
  onDragOverSlot,
  onDragLeave,
  onDrop,
  onSlotClick,
  onRemoveSlot,
  onAdvance,
  advancePending,
}: BracketNodeCardProps) {
  const isHomeOver = dragOver?.nodeId === node.id && dragOver.slot === 'home';
  const isAwayOver = dragOver?.nodeId === node.id && dragOver.slot === 'away';
  const canAdvance = !!(node.home_team && node.away_team && !node.winner_id);
  const isDecided = !!node.winner_id;

  return (
    <div className={`rounded-lg border bg-card shadow-sm overflow-hidden ${isDecided ? 'border-primary/30' : 'border-border'}`}>
      {/* Home slot */}
      <TeamSlot
        team={node.home_team}
        isOver={isHomeOver}
        isDragging={!!dragState}
        isClickTarget={!!selectedTeamId && !node.home_team && !node.winner_id}
        isWinner={node.winner_id === node.home_team_id}
        onDragOver={(e) => {
          e.preventDefault();
          if (dragState) onDragOverSlot(node.id, 'home');
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(node.id, 'home');
        }}
        onClick={() => onSlotClick(node, 'home')}
        onRemove={node.home_team ? () => onRemoveSlot(node, 'home') : undefined}
      />

      {/* Score divider */}
      {node.match && (
        <div className="flex justify-center border-y border-border bg-muted/40 py-1 text-xs font-bold text-foreground">
          {node.match.home_score} – {node.match.away_score}
        </div>
      )}
      {!node.match && (
        <div className="border-y border-border" />
      )}

      {/* Away slot */}
      <TeamSlot
        team={node.away_team}
        isOver={isAwayOver}
        isDragging={!!dragState}
        isClickTarget={!!selectedTeamId && !node.away_team && !node.winner_id}
        isWinner={node.winner_id === node.away_team_id}
        onDragOver={(e) => {
          e.preventDefault();
          if (dragState) onDragOverSlot(node.id, 'away');
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(node.id, 'away');
        }}
        onClick={() => onSlotClick(node, 'away')}
        onRemove={node.away_team ? () => onRemoveSlot(node, 'away') : undefined}
      />

      {/* Advance winner */}
      {canAdvance && (
        <div className="border-t border-border bg-muted/30 p-2 flex gap-1.5">
          <p className="text-[10px] text-muted-foreground self-center mr-1">Winner:</p>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[10px] flex-1 truncate"
            onClick={() => node.home_team && onAdvance(node, node.home_team.id)}
            disabled={advancePending}
          >
            {node.home_team?.name}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[10px] flex-1 truncate"
            onClick={() => node.away_team && onAdvance(node, node.away_team.id)}
            disabled={advancePending}
          >
            {node.away_team?.name}
          </Button>
        </div>
      )}

      {isDecided && (
        <div className="border-t border-border bg-primary/5 px-3 py-1.5">
          <p className="text-[10px] font-semibold text-primary">
            Winner: {
              node.winner_id === node.home_team_id
                ? node.home_team?.name
                : node.away_team?.name
            }
          </p>
        </div>
      )}
    </div>
  );
}

interface TeamSlotProps {
  team?: Team | null;
  isOver: boolean;
  isDragging: boolean;
  isClickTarget: boolean;
  isWinner: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onRemove?: () => void;
}

function TeamSlot({
  team,
  isOver,
  isDragging,
  isClickTarget,
  isWinner,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onRemove,
}: TeamSlotProps) {
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
      className={`flex items-center justify-between gap-2 px-3 py-2 min-h-[36px] transition-colors ${
        isOver
          ? 'bg-primary/10 border-primary/30'
          : isClickTarget
          ? 'bg-primary/5 ring-1 ring-primary/40 cursor-pointer'
          : isDragging && !team
          ? 'bg-muted/60 border-dashed'
          : ''
      } ${isWinner ? 'bg-primary/5' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={isClickTarget ? onClick : undefined}
    >
      {team ? (
        <>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: team.primary_color ?? '#94a3b8' }}
            />
            <span className={`text-xs font-medium truncate ${isWinner ? 'text-primary font-semibold' : 'text-foreground'}`}>
              {team.name}
            </span>
          </div>
          {onRemove && !isWinner && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-muted-foreground hover:text-destructive text-[10px] shrink-0 ml-1"
              title="Remove team from slot"
            >
              ×
            </button>
          )}
        </>
      ) : (
        <span className={`text-[11px] italic ${isOver || isClickTarget ? 'text-primary font-medium' : 'text-muted-foreground/60'}`}>
          {isOver ? 'Drop here' : isClickTarget ? 'Click to place team' : 'Empty slot'}
        </span>
      )}
    </div>
  );
}
