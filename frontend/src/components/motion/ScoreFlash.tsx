import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScoreFlashProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
}

/** CSS-only score highlight on update — GPU-friendly */
export function ScoreFlash({ children, active, className }: ScoreFlashProps) {
  return (
    <span
      className={cn(
        'tabular-nums transition-colors duration-300',
        active && 'motion-safe:animate-score-flash',
        className,
      )}
    >
      {children}
    </span>
  );
}
