import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { bracketFormatLabel, bracketSizeForTeamCount, type BracketSeeding } from '@/lib/bracket-utils';
import { GitBranch, Shuffle, Hand, Trophy } from 'lucide-react';

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
  onGenerate: (seeding: BracketSeeding) => void;
}

const SEEDING_OPTIONS: Array<{
  id: BracketSeeding;
  label: string;
  description: string;
  icon: typeof Trophy;
}> = [
  {
    id: 'standard',
    label: 'Standard seeding',
    description: '1 vs 8, 2 vs 7, 3 vs 6… Top seeds spread across the bracket. BYEs auto-advance.',
    icon: Trophy,
  },
  {
    id: 'random',
    label: 'Random draw',
    description: 'Shuffle teams into bracket slots. Each team appears once.',
    icon: Shuffle,
  },
  {
    id: 'manual',
    label: 'Manual (empty bracket)',
    description: 'Create the bracket structure only. Drag every team into place yourself.',
    icon: Hand,
  },
];

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
            {teamCount} team{teamCount !== 1 ? 's' : ''} will be seeded · {bracketFormatLabel(teamCount)}
            {byeCount > 0 && ` · ${byeCount} BYE${byeCount > 1 ? 's' : ''}`}
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

          {SEEDING_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={pending || !canGenerate}
                onClick={() => onGenerate(opt.id)}
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
                  </div>
                </div>
              </button>
            );
          })}

          {teamCount < 2 && (
            <p className="text-xs text-destructive">Need at least 2 teams in this division.</p>
          )}

          {isRegenerate && (
            <p className="text-xs text-muted-foreground">
              Regenerating replaces the entire bracket. All {teamCount} teams are re-seeded from scratch.
            </p>
          )}

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
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center px-4">
      <GitBranch className="h-12 w-12 text-muted-foreground/40" />
      <div>
        <p className="text-sm font-medium text-foreground">No bracket yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Choose a seeding method and the full knockout tree is created instantly. Then drag or click teams to adjust.
        </p>
      </div>
      <Button onClick={onCreate} disabled={teamCount < 2}>
        <GitBranch className="mr-1.5 h-4 w-4" />
        Create Bracket
      </Button>
    </div>
  );
}
