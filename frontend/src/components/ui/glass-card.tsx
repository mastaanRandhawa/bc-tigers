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
        'relative overflow-hidden rounded-xl',
        'border border-border/50 bg-card',
        'shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
