import { GripVertical, Trophy } from "lucide-react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { configureMatchDrag, isByeSlot } from "@/lib/bracket-utils";
import type { BracketNode, BracketStage, Team } from "@/types";
import { STAGE_LABELS } from "./constants";
import { EmptySlot } from "./EmptySlot";
import { MatchTeamRow } from "./MatchTeamRow";

interface MatchCardProps {
  node: BracketNode;
  firstStage: string | null;
  structureLocked: boolean;
  resultsFrozen: boolean;
  allowPlacement: boolean;
  canSwapMatch: boolean;
  matchDragId: string | null;
  matchDropId: string | null;
  dragOver: { nodeId: string; slot: "home" | "away" } | null;
  dragState: { teamId: string } | null;
  selectedTeamId: string | null;
  onMatchDragStart: (nodeId: string) => void;
  onMatchDragOver: (nodeId: string) => void;
  onMatchDragLeave: () => void;
  onMatchDragEnd: () => void;
  onMatchDrop: (nodeIdA: string, nodeIdB: string) => void;
  onDragStartFromSlot: (
    team: Team,
    from: { nodeId: string; slot: "home" | "away" },
    e: React.DragEvent,
  ) => void;
  onDragOverSlot: (nodeId: string, slot: "home" | "away") => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, nodeId: string, slot: "home" | "away") => void;
  onSlotClick: (node: BracketNode, slot: "home" | "away") => void;
  onRemoveSlot: (node: BracketNode, slot: "home" | "away") => void;
}

function matchStatus(node: BracketNode): {
  label: string;
  tone: "pending" | "ready" | "live" | "done";
} {
  if (node.winner_id) return { label: "Complete", tone: "done" };
  if (node.match?.status === "LIVE" || node.match?.status === "HALFTIME")
    return { label: "Live", tone: "live" };
  if (node.home_team_id && node.away_team_id)
    return { label: "Ready", tone: "ready" };
  return { label: "Pending", tone: "pending" };
}

export function MatchCard({
  node,
  structureLocked,
  resultsFrozen,
  allowPlacement,
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
}: MatchCardProps) {
  const slotLocked = structureLocked || !allowPlacement;
  const status = matchStatus(node);
  const isDecided = !!node.winner_id;
  const isAutoAdvanced = node.auto_advanced || node.status === "AUTO_ADVANCED";
  // Both teams are set and the game hasn't been decided yet — the admin records
  // the winner by completing the actual match, not from the bracket.
  const awaitingResult =
    !!(node.home_team_id && node.away_team_id && !node.winner_id) &&
    !isByeSlot(node, "home") &&
    !isByeSlot(node, "away") &&
    !resultsFrozen;

  const isMatchDragging = matchDragId === node.id;
  const isMatchDropTarget = matchDropId === node.id && matchDragId !== node.id;
  const isFinal = node.stage === "FINAL";

  const renderSlot = (slot: "home" | "away") => {
    const team = slot === "home" ? node.home_team : node.away_team;
    const bye = isByeSlot(node, slot);
    const isOver = dragOver?.nodeId === node.id && dragOver.slot === slot;
    const isClickTarget =
      !!selectedTeamId && allowPlacement && !isByeSlot(node, slot);
    const isWinner =
      !!node.winner_id &&
      node.winner_id ===
        (slot === "home" ? node.home_team_id : node.away_team_id);
    const isLoser = !!node.winner_id && !isWinner && !!team;

    if (bye) {
      return (
        <div className="flex min-h-[44px] items-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 italic">
          BYE · auto-advance
        </div>
      );
    }

    if (team) {
      return (
        <MatchTeamRow
          team={team}
          slot={slot}
          nodeId={node.id}
          score={
            slot === "home" ? node.match?.home_score : node.match?.away_score
          }
          isWinner={isWinner}
          isLoser={isLoser}
          locked={slotLocked}
          onDragStart={onDragStartFromSlot}
          onRemove={allowPlacement ? () => onRemoveSlot(node, slot) : undefined}
        />
      );
    }

    return (
      <div className="px-2 py-1.5">
        <EmptySlot
          isOver={isOver}
          isClickTarget={isClickTarget}
          isDragging={!!dragState}
          locked={slotLocked}
          onDragOver={(e) => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
            onDragOverSlot(node.id, slot);
          }}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, node.id, slot)}
          onClick={() => onSlotClick(node, slot)}
        />
      </div>
    );
  };

  return (
    <m.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "admin-bracket-match w-[248px] overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-sm)] transition-shadow duration-[var(--motion-normal)]",
        isDecided
          ? "border-emerald-500/25 shadow-[var(--shadow-md)]"
          : "border-border/80",
        isFinal && "ring-1 ring-primary/15",
        isMatchDropTarget && "ring-2 ring-primary/35",
        isMatchDragging && "opacity-60",
      )}
      onDragOver={
        canSwapMatch && matchDragId && matchDragId !== node.id && !dragState
          ? (e) => {
              e.preventDefault();
              if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
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
      aria-label={`${STAGE_LABELS[node.stage as BracketStage]} match`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isFinal && (
            <Trophy
              className="h-3.5 w-3.5 shrink-0 text-amber-500"
              aria-hidden
            />
          )}
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {STAGE_LABELS[node.stage as BracketStage]}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            status.tone === "done" &&
              "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            status.tone === "ready" && "bg-primary/10 text-primary",
            status.tone === "live" &&
              "bg-amber-500/10 text-amber-700 dark:text-amber-300",
            status.tone === "pending" && "bg-muted text-muted-foreground",
          )}
        >
          {status.label}
        </span>
      </header>

      {canSwapMatch && (
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            configureMatchDrag(e.nativeEvent, node.id);
            onMatchDragStart(node.id);
          }}
          onDragEnd={onMatchDragEnd}
          className="flex cursor-grab items-center justify-center gap-1 border-b border-border/60 bg-muted/20 py-1 text-[10px] text-muted-foreground active:cursor-grabbing"
          title="Drag to swap with another match in this round"
        >
          <GripVertical className="h-3 w-3" aria-hidden />
          Swap fixture
        </div>
      )}

      <div className="divide-y divide-border/70">
        {renderSlot("home")}
        {renderSlot("away")}
      </div>

      {isDecided && (
        <footer className="border-t border-border/70 bg-emerald-500/5 px-3 py-2">
          <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            {isAutoAdvanced ? "Auto-advanced" : "Winner selected"}
          </p>
        </footer>
      )}

      {awaitingResult && (
        <footer className="border-t border-border/60 bg-muted/20 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">
            Record this match’s result to set the winner and advance
          </p>
        </footer>
      )}
    </m.article>
  );
}
