import type { ReactNode } from 'react';
import SurfaceCard from '@/components/design-system/SurfaceCard';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: ReactNode;
  className?: string;
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
    <SurfaceCard as="section" variant="default" className={className}>
      {children}
    </SurfaceCard>
  );
}
