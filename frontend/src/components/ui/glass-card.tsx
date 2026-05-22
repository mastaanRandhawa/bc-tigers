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
        'relative overflow-hidden rounded-2xl',
        'border border-white/10 bg-card/60 backdrop-blur-xl',
        'shadow-[inset_1px_1px_1px_rgba(255,255,255,0.08),inset_-1px_-1px_1px_rgba(0,0,0,0.3)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
