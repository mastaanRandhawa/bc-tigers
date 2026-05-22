import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: ReactNode;
  className?: string;
  /**
   * default — white card panel (shadow, no border on content inside)
   * flat    — no panel chrome; for free-floating content groups
   */
  variant?: 'default' | 'flat';
}

export default function Section({ children, className, variant = 'default' }: SectionProps) {
  if (variant === 'flat') {
    return (
      <section className={cn('space-y-3', className)}>
        {children}
      </section>
    );
  }

  return (
    <section
      className={cn(
        'rounded-md border border-border/80 bg-card shadow-sm p-3 md:p-3.5',
        className,
      )}
    >
      {children}
    </section>
  );
}
