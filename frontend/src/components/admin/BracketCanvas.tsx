import { useCallback, useState } from "react";
import {
  useBracket,
  useGenerateBracket,
  useRandomizeBracket,
  usePlaceBracketTeam,
  usePlaceBracketSlotSource,
  useRestoreBracket,
  useSetBracketLock,
  useFinalizeBracket,
  useUnfinalizeBracket,
  useSwapBracketMatches,
  useAssignBracketTeams,
  useValidateBracket,
} from "@/hooks/useBrackets";
import BracketView from "@/components/BracketView";
import QueryState from "@/components/shared/QueryState";
import {
  BracketGenerateSheet,
  BracketEmptyState,
} from "@/components/admin/BracketGenerateSheet";
import { getApiErrorMessage } from "@/lib/errors";
import { nowISO } from "@/lib/date";
import {
  isStructureLocked,
  isResultsFrozen,
  hasPlayedMatches,
  canManuallyPlaceInNode,
  isByeSlot,
  snapshotFromNodes,
  earliestStage,
  configureTeamDrag,
  readTeamDragId,
  readMatchDragId,
  type BracketSnapshot,
} from "@/lib/bracket-utils";
import type { BracketNode, Team } from "@/types";
import { STAGE_ORDER } from "@/components/admin/bracket/constants";
import { BracketStatusBanner } from "@/components/admin/bracket/BracketStatusBanner";
import { BracketTree } from "@/components/admin/bracket/BracketTree";
import { TeamPool } from "@/components/admin/bracket/TeamPool";
import { TournamentToolbar } from "@/components/admin/bracket/TournamentToolbar";
import { BracketSlotPicker } from "@/components/admin/bracket/BracketSlotPicker";
import { useMatches } from "@/hooks/useMatches";
import type { DragState } from "@/components/admin/bracket/types";

interface BracketCanvasProps {
  divisionId: string;
  divisionSlug: string;
  divisionName?: string;
  tournamentName?: string;
  teams?: Team[];
  adminBracketLocked?: boolean;
  adminBracketFinalized?: boolean;
  viewOnly?: boolean;
}

export function BracketCanvas({
  divisionId,
  divisionSlug,
  teams = [],
  divisionName,
  tournamentName,
  adminBracketLocked = false,
  adminBracketFinalized = false,
  viewOnly = false,
}: BracketCanvasProps) {
  const {
    data: nodes = [],
    isLoading,
    isError,
    refetch,
  } = useBracket(divisionId);
  const generateMutation = useGenerateBracket();
  const randomizeMutation = useRandomizeBracket();
  const placeMutation = usePlaceBracketTeam();
  const placeSourceMutation = usePlaceBracketSlotSource();
  const restoreMutation = useRestoreBracket();
  const lockMutation = useSetBracketLock();
  const finalizeMutation = useFinalizeBracket();
  const unfinalizeMutation = useUnfinalizeBracket();
  const swapMutation = useSwapBracketMatches();
  const assignMutation = useAssignBracketTeams();

  const [showGenerate, setShowGenerate] = useState(false);
  const { data: bracketValidation } = useValidateBracket(
    showGenerate ? divisionId : undefined,
  );
  const [dragOver, setDragOver] = useState<{
    nodeId: string;
    slot: "home" | "away";
  } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [matchDragId, setMatchDragId] = useState<string | null>(null);
  const [matchDropId, setMatchDropId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState("");
  const [undoStack, setUndoStack] = useState<BracketSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<BracketSnapshot[]>([]);
  const [randomizing, setRandomizing] = useState(false);
  const [slotPicker, setSlotPicker] = useState<{
    node: BracketNode;
    slot: "home" | "away";
  } | null>(null);

  const { data: divisionMatches = [] } = useMatches(
    divisionId ? { divisionId, limit: 200 } : undefined,
  );

  const playedMatches = hasPlayedMatches(nodes);
  const structureLocked = isStructureLocked(
    adminBracketLocked,
    adminBracketFinalized,
  );
  const resultsFrozen = isResultsFrozen(adminBracketFinalized);
  const firstStage = earliestStage(nodes, STAGE_ORDER);

  const assignedTeamIds = new Set<string>();
  for (const node of nodes) {
    if (node.home_team_id) assignedTeamIds.add(node.home_team_id);
    if (node.away_team_id) assignedTeamIds.add(node.away_team_id);
  }

  const recordHistory = useCallback(
    (snapshot?: BracketSnapshot) => {
      const snap = snapshot ?? snapshotFromNodes(nodes);
      if (snap.length === 0) return;
      setUndoStack((prev) => [...prev, snap].slice(-40));
      setRedoStack([]);
    },
    [nodes],
  );

  const applySnapshot = async (snapshot: BracketSnapshot) => {
    await restoreMutation.mutateAsync({ divisionId, snapshot });
  };

  const undo = async () => {
    const prev = undoStack[undoStack.length - 1];
    if (!prev || structureLocked) return;
    setError("");
    try {
      const current = snapshotFromNodes(nodes);
      setUndoStack((s) => s.slice(0, -1));
      setRedoStack((s) => [...s, current]);
      await applySnapshot(prev);
    } catch (err) {
      setError(getApiErrorMessage(err, "Undo failed"));
    }
  };

  const redo = async () => {
    const next = redoStack[redoStack.length - 1];
    if (!next || structureLocked) return;
    setError("");
    try {
      const current = snapshotFromNodes(nodes);
      setRedoStack((s) => s.slice(0, -1));
      setUndoStack((s) => [...s, current]);
      await applySnapshot(next);
    } catch (err) {
      setError(getApiErrorMessage(err, "Redo failed"));
    }
  };

  const startDrag = (
    team: Team,
    from?: { nodeId: string; slot: "home" | "away" },
    e?: React.DragEvent,
  ) => {
    if (structureLocked) return;
    if (!from && assignedTeamIds.has(team.id)) return;
    if (from) {
      const sourceNode = nodes.find((n) => n.id === from.nodeId);
      if (sourceNode && !canManuallyPlaceInNode(sourceNode, firstStage)) return;
    }
    if (e) configureTeamDrag(e.nativeEvent, team.id);
    setDragState({ teamId: team.id, teamName: team.name, from });
    setSelectedTeam(null);
    setMatchDragId(null);
  };

  const placeTeam = async (
    nodeId: string,
    slot: "home" | "away",
    teamId: string,
  ) => {
    if (structureLocked) return;
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode || !canManuallyPlaceInNode(targetNode, firstStage)) return;
    if (dragState?.from) {
      const sourceNode = nodes.find((n) => n.id === dragState.from!.nodeId);
      if (sourceNode && !canManuallyPlaceInNode(sourceNode, firstStage)) return;
    }
    const before = snapshotFromNodes(nodes);
    setError("");
    try {
      await placeMutation.mutateAsync({ nodeId, teamId, slot });
      recordHistory(before);
      setSelectedTeam(null);
      setDragState(null);
      setDragOver(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to place team"));
    }
  };

  const handleDrop = async (
    e: React.DragEvent,
    nodeId: string,
    slot: "home" | "away",
  ) => {
    if (structureLocked || readMatchDragId(e.nativeEvent)) return;
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode || !canManuallyPlaceInNode(targetNode, firstStage)) return;
    e.preventDefault();
    e.stopPropagation();
    const teamId = dragState?.teamId ?? readTeamDragId(e.nativeEvent);
    if (!teamId) return;
    await placeTeam(nodeId, slot, teamId);
  };

  const handleSlotClick = async (node: BracketNode, slot: "home" | "away") => {
    if (structureLocked || !canManuallyPlaceInNode(node, firstStage)) return;
    if (isByeSlot(node, slot)) return;
    if (selectedTeam) {
      await placeTeam(node.id, slot, selectedTeam.id);
      return;
    }
    setSlotPicker({ node, slot });
  };

  const handlePoolClick = (team: Team, multi: boolean) => {
    if (structureLocked) return;
    if (!multi && assignedTeamIds.has(team.id)) return;
    if (multi) {
      setSelectedTeamIds((prev) => {
        const next = new Set(prev);
        if (next.has(team.id)) next.delete(team.id);
        else next.add(team.id);
        return next;
      });
      setSelectedTeam(null);
    } else {
      setSelectedTeam((prev) =>
        prev?.id === team.id ? null : { id: team.id, name: team.name },
      );
      setSelectedTeamIds(new Set());
    }
    setDragState(null);
  };

  const handleRemoveSelected = async (teamIds: string[]) => {
    if (structureLocked || teamIds.length === 0) return;
    const before = snapshotFromNodes(nodes);
    const removeSet = new Set(teamIds);
    const snap = before.map((s) => {
      const node = nodes.find((n) => n.id === s.id)!;
      return {
        ...s,
        home_team_id:
          node.home_team_id && removeSet.has(node.home_team_id)
            ? null
            : s.home_team_id,
        away_team_id:
          node.away_team_id && removeSet.has(node.away_team_id)
            ? null
            : s.away_team_id,
        winner_id: null,
      };
    });
    setError("");
    try {
      await restoreMutation.mutateAsync({ divisionId, snapshot: snap });
      recordHistory(before);
      setSelectedTeamIds(new Set());
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to remove teams"));
    }
  };

  const handleRandomizeSelected = async (teamIds: string[]) => {
    if (structureLocked || teamIds.length === 0) return;
    const before = snapshotFromNodes(nodes);
    setRandomizing(true);
    setError("");
    try {
      await assignMutation.mutateAsync({ divisionId, teamIds });
      recordHistory(before);
      setSelectedTeamIds(new Set());
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to assign teams"));
    } finally {
      setTimeout(() => setRandomizing(false), 500);
    }
  };

  const handleToggleLock = async () => {
    if (resultsFrozen) {
      setError("Unfinalize the bracket before changing structure lock");
      return;
    }
    if (playedMatches && adminBracketLocked) {
      setError("Cannot unlock — matches have already started");
      return;
    }
    setError("");
    try {
      await lockMutation.mutateAsync({
        divisionId,
        locked: !adminBracketLocked,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update bracket lock"));
    }
  };

  const handleFinalize = async () => {
    setError("");
    try {
      await finalizeMutation.mutateAsync(divisionId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to finalize bracket"));
    }
  };

  const handleUnfinalize = async () => {
    setError("");
    try {
      await unfinalizeMutation.mutateAsync(divisionId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to unfinalize bracket"));
    }
  };

  const handleSwapMatches = async (nodeIdA: string, nodeIdB: string) => {
    if (structureLocked) return;
    const before = snapshotFromNodes(nodes);
    setError("");
    try {
      await swapMutation.mutateAsync({ nodeIdA, nodeIdB });
      recordHistory(before);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to swap matches"));
    }
    setMatchDragId(null);
    setMatchDropId(null);
  };

  const handleRemove = async (node: BracketNode, slot: "home" | "away") => {
    if (structureLocked) return;
    const before = snapshotFromNodes(nodes);
    setError("");
    const snap = before.map((s) =>
      s.id === node.id
        ? {
            ...s,
            [slot === "home" ? "home_team_id" : "away_team_id"]: null,
            winner_id: null,
          }
        : s,
    );
    try {
      await restoreMutation.mutateAsync({ divisionId, snapshot: snap });
      recordHistory(before);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to remove team"));
    }
  };

  const handleGenerate = async (bracketSize: number) => {
    setError("");
    try {
      await generateMutation.mutateAsync({ divisionId, bracketSize });
      setUndoStack([]);
      setRedoStack([]);
      setShowGenerate(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to generate bracket"));
    }
  };

  const handleRandomize = async () => {
    if (structureLocked) return;
    const before = snapshotFromNodes(nodes);
    setRandomizing(true);
    setError("");
    try {
      await randomizeMutation.mutateAsync(divisionId);
      recordHistory(before);
    } catch (err) {
      setError(getApiErrorMessage(err, "Random draw failed"));
    } finally {
      setTimeout(() => setRandomizing(false), 600);
    }
  };

  const handleExport = () => {
    const payload = {
      divisionId,
      divisionSlug,
      divisionName,
      tournamentName,
      exportedAt: nowISO(),
      nodes: snapshotFromNodes(nodes),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bracket-${divisionSlug || divisionId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const busy =
    generateMutation.isPending ||
    randomizeMutation.isPending ||
    placeMutation.isPending ||
    restoreMutation.isPending ||
    lockMutation.isPending ||
    finalizeMutation.isPending ||
    unfinalizeMutation.isPending ||
    swapMutation.isPending ||
    assignMutation.isPending ||
    placeSourceMutation.isPending;

  return (
    <div className="space-y-8">
      {(tournamentName || divisionName) && (
        <header className="space-y-1">
          {tournamentName && (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {tournamentName}
            </p>
          )}
          {divisionName && (
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {divisionName}
            </h1>
          )}
        </header>
      )}

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={false}
      >
        {nodes.length === 0 ? (
          viewOnly ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No bracket for this division.
            </div>
          ) : (
            <BracketEmptyState
              teamCount={teams.length}
              onCreate={() => setShowGenerate(true)}
            />
          )
        ) : viewOnly ? (
          <BracketView nodes={nodes} />
        ) : (
          <div className="space-y-8">
            <BracketStatusBanner
              resultsFrozen={resultsFrozen}
              structureLocked={structureLocked}
              adminBracketLocked={adminBracketLocked}
              unassignedCount={
                teams.filter((t) => !assignedTeamIds.has(t.id)).length
              }
            />

            <TournamentToolbar
              structureLocked={structureLocked}
              resultsFrozen={resultsFrozen}
              adminBracketLocked={adminBracketLocked}
              playedMatches={playedMatches}
              busy={busy}
              randomizing={randomizing}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              onUndo={undo}
              onRedo={redo}
              onRandomDraw={handleRandomize}
              onRegenerate={() => setShowGenerate(true)}
              onToggleLock={handleToggleLock}
              onFinalize={handleFinalize}
              onUnfinalize={handleUnfinalize}
              onExport={handleExport}
            />

            <TeamPool
              teams={teams}
              assignedTeamIds={assignedTeamIds}
              selectedTeamId={selectedTeam?.id ?? null}
              selectedTeamIds={selectedTeamIds}
              dragTeamId={dragState?.teamId ?? null}
              locked={structureLocked}
              busy={busy}
              onSelectTeam={handlePoolClick}
              onDragStart={(team, e) => startDrag(team, undefined, e)}
              onDragEnd={() => setDragState(null)}
              onRandomizeSelected={handleRandomizeSelected}
              onRemoveSelected={handleRemoveSelected}
              onClearSelection={() => setSelectedTeamIds(new Set())}
            />

            <BracketTree
              nodes={nodes}
              firstStage={firstStage}
              structureLocked={structureLocked}
              resultsFrozen={resultsFrozen}
              adminBracketFinalized={adminBracketFinalized}
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
              onMatchDrop={handleSwapMatches}
              onDragStartFromSlot={(team, from, e) => startDrag(team, from, e)}
              onDragOverSlot={(nodeId, slot) => {
                const target = nodes.find((n) => n.id === nodeId);
                if (
                  !structureLocked &&
                  dragState &&
                  !matchDragId &&
                  target &&
                  canManuallyPlaceInNode(target, firstStage)
                ) {
                  setDragOver({ nodeId, slot });
                }
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={handleDrop}
              onSlotClick={handleSlotClick}
              onRemoveSlot={handleRemove}
            />
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

      <BracketSlotPicker
        open={!!slotPicker}
        onOpenChange={(open) => !open && setSlotPicker(null)}
        node={slotPicker?.node ?? null}
        slot={slotPicker?.slot ?? null}
        teams={teams}
        divisionMatches={divisionMatches}
        selectedTeamId={selectedTeam?.id}
        pending={placeMutation.isPending || placeSourceMutation.isPending}
        onPlaceTeam={async (nodeId, slot, teamId) => {
          setError("");
          try {
            await placeTeam(nodeId, slot, teamId);
            setSelectedTeam(null);
          } catch (err) {
            setError(getApiErrorMessage(err, "Failed to place team"));
            throw err;
          }
        }}
        onPlaceSource={async (nodeId, slot, sourceMatchId, outcome) => {
          setError("");
          const before = snapshotFromNodes(nodes);
          try {
            await placeSourceMutation.mutateAsync({
              nodeId,
              slot,
              sourceMatchId,
              outcome,
            });
            recordHistory(before);
          } catch (err) {
            setError(getApiErrorMessage(err, "Failed to set placeholder"));
            throw err;
          }
        }}
      />
    </div>
  );
}
