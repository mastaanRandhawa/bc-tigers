import type { ReactNode } from 'react';
import { m } from 'motion/react';
import { scaleIn, transitionSpring } from '@/lib/motion/variants';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface ScaleInProps {
  children: ReactNode;
  className?: string;
}

export function ScaleIn({ children, className }: ScaleInProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={scaleIn}
      transition={transitionSpring}
    >
      {children}
    </m.div>
  );
}
