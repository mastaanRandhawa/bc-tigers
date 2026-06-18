import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUpdateMatchScoreOptimistic } from '@/hooks/useMatches';

interface MatchScoreStepperProps {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homeLabel?: string;
  awayLabel?: string;
  disabled?: boolean;
  className?: string;
}

function ScoreControl({
  label,
  score,
  onDecrement,
  onIncrement,
  disabled,
  pending,
}: {
  label: string;
  score: number;
  onDecrement: () => void;
  onIncrement: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <span className="max-w-[9rem] truncate text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-lg border-border/60 bg-background"
          onClick={onDecrement}
          disabled={disabled || pending || score <= 0}
          aria-label={`Decrease ${label} score`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-[2.5rem] text-center font-display text-2xl font-bold tabular-nums">
          {score}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-lg border-border/60 bg-background"
          onClick={onIncrement}
          disabled={disabled || pending}
          aria-label={`Increase ${label} score`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function MatchScoreStepper({
  matchId,
  homeScore,
  awayScore,
  homeLabel = 'Home',
  awayLabel = 'Away',
  disabled = false,
  className,
}: MatchScoreStepperProps) {
  const mutation = useUpdateMatchScoreOptimistic();

  const update = (home: number, away: number) => {
    mutation.mutate({ id: matchId, home, away });
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border/40 bg-muted/30 p-4 sm:p-5',
        className,
      )}
    >
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Quick score update
      </p>
      <div className="flex items-center justify-center gap-6 sm:gap-12">
        <ScoreControl
          label={homeLabel}
          score={homeScore}
          onDecrement={() => update(homeScore - 1, awayScore)}
          onIncrement={() => update(homeScore + 1, awayScore)}
          disabled={disabled}
          pending={mutation.isPending}
        />
        <span className="font-display text-lg font-light text-muted-foreground/30">—</span>
        <ScoreControl
          label={awayLabel}
          score={awayScore}
          onDecrement={() => update(homeScore, awayScore - 1)}
          onIncrement={() => update(homeScore, awayScore + 1)}
          disabled={disabled}
          pending={mutation.isPending}
        />
      </div>
    </div>
  );
}
