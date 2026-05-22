import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * A theme-aware glass panel.
 *
 * Dark mode: translucent bg + backdrop-blur + inset edge highlight → glass effect.
 * Light mode: bg-card/60 is effectively opaque white → degrades to a normal card.
 */
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md',
        'border border-border/80 bg-card/80 backdrop-blur-xl',
        'shadow-sm dark:border-white/10 dark:bg-card/60',
        'dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
