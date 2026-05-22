import type { ReactNode } from 'react';
import { m } from 'motion/react';
import { fade, transitionFade, instant } from '@/lib/motion/variants';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface FadeProps {
  children: ReactNode;
  className?: string;
  show?: boolean;
}

export function Fade({ children, className, show = true }: FadeProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return show ? <div className={className}>{children}</div> : null;
  }

  return (
    <m.div
      className={className}
      initial="hidden"
      animate={show ? 'visible' : 'exit'}
      exit="exit"
      variants={fade}
      transition={show ? transitionFade : instant}
    >
      {children}
    </m.div>
  );
}
