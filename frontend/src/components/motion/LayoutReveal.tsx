import type { ReactNode } from 'react';
import { m } from 'motion/react';
import { spring } from '@/lib/motion/tokens';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

interface LayoutRevealProps {
  layoutId: string;
  className?: string;
  children?: ReactNode;
}

/** Sliding pill/tab background — shared layoutId across nav items */
export function LayoutReveal({ layoutId, className, children }: LayoutRevealProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <span className={className}>{children}</span>;
  }

  return (
    <m.span
      layoutId={layoutId}
      className={cn('absolute inset-0 rounded-sm', className)}
      transition={spring.soft}
    >
      {children}
    </m.span>
  );
}
