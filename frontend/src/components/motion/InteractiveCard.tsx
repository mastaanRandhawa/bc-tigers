import type { ReactNode, ComponentPropsWithoutRef } from 'react';
import { m } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

type InteractiveCardProps = ComponentPropsWithoutRef<typeof m.article> & {
  children: ReactNode;
  className?: string;
  as?: 'article' | 'div';
  glow?: boolean;
  live?: boolean;
};

export function InteractiveCard({
  children,
  className,
  as = 'article',
  glow = false,
  live = false,
  ...props
}: InteractiveCardProps) {
  const reduced = usePrefersReducedMotion();
  const Comp = m[as];

  const base = cn(
    'rounded-md border border-border/80 bg-card shadow-sm overflow-hidden',
    'transition-[border-color,box-shadow] duration-200',
    glow && 'hover:border-primary/25 hover:shadow-md',
    live && 'border-l-[3px] border-l-primary',
    className,
  );

  if (reduced) {
    const Tag = as;
    return (
      <Tag className={base} {...(props as object)}>
        {children}
      </Tag>
    );
  }

  return (
    <Comp
      className={cn('gpu-layer', base)}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.998 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      {...props}
    >
      {children}
    </Comp>
  );
}
