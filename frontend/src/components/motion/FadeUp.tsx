import type { ReactNode } from 'react';
import { m } from 'motion/react';
import { fadeUp, transitionFade } from '@/lib/motion/variants';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface FadeUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section' | 'li';
}

export function FadeUp({ children, className, delay = 0, as = 'div' }: FadeUpProps) {
  const reduced = usePrefersReducedMotion();
  const Comp = m[as];

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Comp
      className={className}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ ...transitionFade, delay }}
    >
      {children}
    </Comp>
  );
}
