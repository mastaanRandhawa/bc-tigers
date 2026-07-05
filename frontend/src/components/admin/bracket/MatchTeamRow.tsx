import { Check, X } from 'lucide-react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import type { Team } from '@/types';

interface MatchTeamRowProps {
  team: Team;
  slot: 'home' | 'away';
  nodeId: string;
  score?: number;
  isWinner: boolean;
  isLoser: boolean;
  locked: boolean;
  onDragStart: (team: Team, from: { nodeId: string; slot: 'home' | 'away' }, e: React.DragEvent) => void;
  onRemove?: () => void;
}

export function MatchTeamRow({
  team,
  slot,
  nodeId,
  score,
  isWinner,
  isLoser,
  locked,
  onDragStart,
  onRemove,
}: MatchTeamRowProps) {
  const draggable = !locked;

  return (
    <div
      className={cn(
        'group relative flex min-h-[44px] items-center gap-2.5 px-3 py-2 transition-colors duration-[var(--motion-fast)]',
        isWinner && 'bg-emerald-500/10',
        isLoser && 'opacity-55',
      )}
      aria-label={team.name}
    >
      <div
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2.5',
          draggable ? 'cursor-grab active:cursor-grabbing' : '',
        )}
        draggable={draggable}
        onDragStart={(e) => {
          if (!draggable) {
            e.preventDefault();
            return;
          }
          e.stopPropagation();
          onDragStart(team, { nodeId, slot }, e);
        }}
      >
        {team.logo ? (
          <img src={team.logo} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-border/60" />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-white"
            style={{ backgroundColor: team.primary_color ?? '#64748b' }}
          >
            {team.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-sm',
              isWinner ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'font-medium text-foreground',
            )}
          >
            {team.name}
          </p>
          {team.city && <p className="truncate text-[10px] text-muted-foreground">{team.city}</p>}
        </div>
      </div>

      {score !== undefined && (
        <span
          className={cn(
            'shrink-0 text-sm font-bold tabular-nums',
            isWinner ? 'text-emerald-600' : 'text-muted-foreground',
          )}
        >
          {score}
        </span>
      )}

      {isWinner && (
        <m.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600"
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
        </m.span>
      )}

      {onRemove && !isWinner && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          title="Remove from slot"
          aria-label={`Remove ${team.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
