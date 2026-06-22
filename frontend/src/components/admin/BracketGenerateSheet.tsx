import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { bracketFormatLabel, bracketSizeForTeamCount } from '@/lib/bracket-utils';
import { GitBranch } from 'lucide-react';

interface BracketGenerateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamCount: number;
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    excluded: Array<{ teamName: string; reason: string }>;
    eligibleCount: number;
  };
  isRegenerate?: boolean;
  pending?: boolean;
  onGenerate: () => void;
}

export function BracketGenerateSheet({
  open,
  onOpenChange,
  teamCount,
  validation,
  isRegenerate,
  pending,
  onGenerate,
}: BracketGenerateSheetProps) {
  const bracketSize = bracketSizeForTeamCount(teamCount);
  const byeCount = Math.max(0, bracketSize - teamCount);
  const canGenerate = teamCount >= 2 && (validation?.valid ?? true);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-md w-full">
        <SheetHeader>
          <SheetTitle>{isRegenerate ? 'Regenerate bracket' : 'Create bracket'}</SheetTitle>
          <SheetDescription>
            {teamCount} team{teamCount !== 1 ? 's' : ''} · {bracketFormatLabel(teamCount)}
            {byeCount > 0 && ` · up to ${byeCount} BYE${byeCount > 1 ? 's' : ''} after placement`}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-3 pt-2">
          {validation?.warnings.map((w) => (
            <p key={w} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              {w}
            </p>
          ))}

          {validation?.errors.map((e) => (
            <p key={e} className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {e}
            </p>
          ))}

          {validation?.excluded && validation.excluded.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Excluded teams</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {validation.excluded.map((x) => (
                  <li key={x.teamName}>{x.teamName}: {x.reason}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed">
            {isRegenerate
              ? 'This replaces the entire bracket with a fresh empty knockout tree. All current placements and results will be cleared.'
              : 'An empty knockout tree will be created. Drag teams into slots yourself, or use Random draw to shuffle teams into the first round.'}
          </p>

          {teamCount < 2 && (
            <p className="text-xs text-destructive">Need at least 2 teams in this division.</p>
          )}

          <Button
            className="w-full"
            disabled={pending || !canGenerate}
            onClick={onGenerate}
          >
            <GitBranch className="mr-1.5 h-4 w-4" />
            {isRegenerate ? 'Regenerate bracket' : 'Create bracket'}
          </Button>

          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

export function BracketEmptyState({
  teamCount,
  onCreate,
}: {
  teamCount: number;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-border/80 bg-[hsl(var(--surface-muted))] py-20 text-center px-6 shadow-[var(--shadow-xs)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <GitBranch className="h-8 w-8 text-primary" aria-hidden />
      </div>
      <div className="max-w-md space-y-2">
        <p className="font-display text-xl font-semibold tracking-tight text-foreground">No bracket yet</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Create an empty knockout tree, then drag teams into first-round slots or use Random draw to shuffle placements.
        </p>
      </div>
      <Button onClick={onCreate} disabled={teamCount < 2} size="lg" className="rounded-full px-6">
        <GitBranch className="mr-2 h-4 w-4" />
        Create bracket
      </Button>
    </div>
  );
}
