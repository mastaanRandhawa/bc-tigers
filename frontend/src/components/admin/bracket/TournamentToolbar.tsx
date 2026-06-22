import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  GitBranch,
  Shuffle,
  Undo2,
  Redo2,
  Lock,
  Unlock,
  CheckCircle2,
  RotateCcw,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TournamentToolbarProps {
  structureLocked: boolean;
  resultsFrozen: boolean;
  adminBracketLocked: boolean;
  playedMatches: boolean;
  busy: boolean;
  randomizing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRandomDraw: () => void;
  onRegenerate: () => void;
  onToggleLock: () => void;
  onFinalize: () => void;
  onUnfinalize: () => void;
  onExport: () => void;
}

export function TournamentToolbar({
  structureLocked,
  resultsFrozen,
  adminBracketLocked,
  playedMatches,
  busy,
  randomizing,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onRandomDraw,
  onRegenerate,
  onToggleLock,
  onFinalize,
  onUnfinalize,
  onExport,
}: TournamentToolbarProps) {
  return (
    <div className="rounded-lg border border-border/80 bg-card p-3 shadow-[var(--shadow-sm)] sm:p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarGroup label="History">
            <Button variant="outline" size="sm" onClick={onUndo} disabled={structureLocked || !canUndo || busy}>
              <Undo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onRedo} disabled={structureLocked || !canRedo || busy}>
              <Redo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Redo</span>
            </Button>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup label="Bracket">
            <Button
              variant="outline"
              size="sm"
              onClick={onRandomDraw}
              disabled={structureLocked || busy}
              className={cn(randomizing && 'animate-pulse')}
            >
              <Shuffle className="h-3.5 w-3.5" />
              Random draw
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={structureLocked || busy}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup label="Tournament">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleLock}
              disabled={resultsFrozen || playedMatches || busy}
            >
              {adminBracketLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {adminBracketLocked ? 'Unlock' : 'Lock'}
            </Button>
            {resultsFrozen ? (
              <Button variant="outline" size="sm" onClick={onUnfinalize} disabled={busy}>
                <RotateCcw className="h-3.5 w-3.5" />
                Unfinalize
              </Button>
            ) : (
              <Button size="sm" onClick={onFinalize} disabled={busy}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Finalize
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onExport} disabled={busy}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </ToolbarGroup>
        </div>
      </div>
    </div>
  );
}

function ToolbarGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function ToolbarDivider() {
  return <div className="hidden h-10 w-px bg-border/80 lg:block" aria-hidden />;
}
