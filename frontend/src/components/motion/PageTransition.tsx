import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, m } from 'motion/react';
import { pageTransition, transitionFade } from '@/lib/motion/variants';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={location.pathname}
        className={className}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={pageTransition}
        transition={transitionFade}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

/** Fade wrapper without route key — for lazy page mount */
export function PageFade({ children, className }: PageTransitionProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={pageTransition}
      transition={transitionFade}
    >
      {children}
    </m.div>
  );
}
