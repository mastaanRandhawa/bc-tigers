import { useRef, type ReactNode } from 'react';
import { m, useInView } from 'motion/react';
import { fadeUp, transitionFade } from '@/lib/motion/variants';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  once?: boolean;
}

export function RevealOnScroll({ children, className, once = true }: RevealOnScrollProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: '-40px 0px', amount: 0.15 });
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={transitionFade}
    >
      {children}
    </m.div>
  );
}
