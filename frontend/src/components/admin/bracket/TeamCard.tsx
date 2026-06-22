import type { DragEvent } from 'react';
import { GripVertical, MapPin } from 'lucide-react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { configureTeamDrag } from '@/lib/bracket-utils';
import type { Team } from '@/types';

interface TeamCardProps {
  team: Team;
  assigned: boolean;
  selected: boolean;
  dragging: boolean;
  locked?: boolean;
  onSelect: (team: Team, multi: boolean) => void;
  onDragStart: (team: Team, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export function TeamCard({
  team,
  assigned,
  selected,
  dragging,
  locked,
  onSelect,
  onDragStart,
  onDragEnd,
}: TeamCardProps) {
  const inactive = assigned || !!locked;
  const canDrag = !inactive;
  const canPlace = !locked && !assigned;

  return (
    <m.div
      layout
      role="button"
      tabIndex={canPlace || (!locked && assigned) ? 0 : -1}
      draggable={canDrag}
      onDragStart={(e) => {
        if (!canDrag) {
          e.preventDefault();
          return;
        }
        const dragEvent = e as unknown as DragEvent<HTMLDivElement>;
        dragEvent.stopPropagation();
        configureTeamDrag(dragEvent.nativeEvent, team.id);
        onDragStart(team, dragEvent);
      }}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        if (locked) return;
        if (assigned && !(e.ctrlKey || e.metaKey)) return;
        onSelect(team, e.ctrlKey || e.metaKey);
      }}
      onKeyDown={(e) => {
        if (locked) return;
        if (assigned && !(e.ctrlKey || e.metaKey)) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(team, e.ctrlKey || e.metaKey);
        }
      }}
      whileTap={canPlace ? { scale: 0.99 } : undefined}
      className={cn(
        'group relative flex min-h-[88px] w-full min-w-[220px] max-w-[280px] flex-col rounded-lg border p-3 text-left transition-[box-shadow,border-color,opacity,filter] duration-[var(--motion-normal)]',
        assigned
          ? 'cursor-default border-border/50 bg-muted/50 opacity-55 grayscale shadow-none'
          : locked
          ? 'cursor-not-allowed border-border/60 bg-card opacity-60 shadow-[var(--shadow-sm)]'
          : 'cursor-grab border-border/80 bg-card shadow-[var(--shadow-sm)] active:cursor-grabbing hover:border-primary/25 hover:shadow-[var(--shadow-hover)]',
        selected && !assigned && 'border-primary/40 ring-2 ring-primary/25 shadow-[var(--shadow-md)]',
        dragging && 'border-primary/30 opacity-60',
        selected && assigned && 'ring-2 ring-muted-foreground/20 opacity-70',
      )}
      style={
        assigned
          ? undefined
          : { borderTopColor: team.primary_color ?? undefined, borderTopWidth: 3 }
      }
      aria-pressed={selected}
      aria-disabled={assigned && !selected}
      aria-label={`${team.name}${assigned ? ', placed in bracket' : ', available'}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {team.logo ? (
            <img
              src={team.logo}
              alt=""
              className={cn(
                'h-10 w-10 rounded-md object-cover ring-1 ring-border/60',
                assigned && 'opacity-80',
              )}
            />
          ) : (
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold text-white',
                assigned && 'opacity-70',
              )}
              style={{ backgroundColor: assigned ? '#94a3b8' : team.primary_color ?? '#64748b' }}
            >
              {team.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p
              className={cn(
                'truncate text-sm font-semibold',
                assigned ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {team.name}
            </p>
            {team.division?.name && (
              <p className="truncate text-[11px] text-muted-foreground/80">{team.division.name}</p>
            )}
          </div>
        </div>
        {canDrag && (
          <GripVertical
            className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground"
            aria-hidden
          />
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        {team.city ? (
          <span className="inline-flex items-center gap-1 truncate text-[11px] text-muted-foreground/80">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            {team.city}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/50">No city</span>
        )}
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            assigned
              ? 'bg-muted text-muted-foreground'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
          )}
        >
          {assigned ? 'Placed' : 'Available'}
        </span>
      </div>
    </m.div>
  );
}
