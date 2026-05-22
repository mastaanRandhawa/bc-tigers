import type { ReactNode, ComponentPropsWithoutRef } from 'react';
import { m } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

type PressableProps = ComponentPropsWithoutRef<typeof m.div> & {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export function Pressable({ children, className, disabled, ...props }: PressableProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced || disabled) {
    return (
      <div className={className} {...(props as object)}>
        {children}
      </div>
    );
  }

  return (
    <m.div
      className={cn('gpu-layer', className)}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      {...props}
    >
      {children}
    </m.div>
  );
}
