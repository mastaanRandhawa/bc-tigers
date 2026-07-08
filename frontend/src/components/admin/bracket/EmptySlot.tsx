import { Plus } from 'lucide-react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';

interface EmptySlotProps {
  isOver: boolean;
  isClickTarget: boolean;
  isDragging: boolean;
  locked: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}

export function EmptySlot({
  isOver,
  isClickTarget,
  isDragging,
  locked,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: EmptySlotProps) {
  const interactive = !locked && (isClickTarget || isDragging);

  return (
    <m.div
      role="button"
      tabIndex={isClickTarget ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      animate={isOver ? { scale: 1.01 } : { scale: 1 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'flex min-h-[44px] items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 transition-colors duration-[var(--motion-fast)]',
        locked
          ? 'border-border/50 bg-muted/20 text-muted-foreground/50'
          : isOver
          ? 'border-primary bg-primary/10 text-primary'
          : isClickTarget
          ? 'border-primary/40 bg-primary/5 text-primary cursor-pointer'
          : isDragging
          ? 'border-primary/30 bg-muted/40 text-muted-foreground'
          : 'border-border/70 bg-muted/20 text-muted-foreground hover:border-primary/30 hover:bg-primary/5',
      )}
      onDragOver={locked ? undefined : onDragOver}
      onDragLeave={locked ? undefined : onDragLeave}
      onDrop={locked ? undefined : onDrop}
      onClick={isClickTarget ? onClick : undefined}
      aria-label={interactive ? 'Drop team here' : 'Empty match slot'}
    >
      <Plus className={cn('h-3.5 w-3.5 shrink-0', isOver && 'scale-110')} aria-hidden />
      <span className="text-xs font-medium">
        {isOver ? 'Release to place' : isClickTarget ? 'Click to configure' : 'Drop team here'}
      </span>
    </m.div>
  );
}
