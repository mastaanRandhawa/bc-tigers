import type { ReactNode } from 'react';
import { m } from 'motion/react';
import { listContainer, listItem, transitionFade } from '@/lib/motion/variants';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  as?: 'div' | 'ul' | 'ol';
}

export function StaggerList({ children, className, itemClassName, as = 'div' }: StaggerListProps) {
  const reduced = usePrefersReducedMotion();
  const Container = m[as];

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Container
      className={className}
      initial="hidden"
      animate="visible"
      variants={listContainer}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <m.li
              key={i}
              className={cn(itemClassName, as === 'div' && 'list-none')}
              variants={listItem}
              transition={transitionFade}
            >
              {child}
            </m.li>
          ))
        : children}
    </Container>
  );
}

/** Wrap a single stagger child */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div className={className} variants={listItem} transition={transitionFade}>
      {children}
    </m.div>
  );
}
