import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContentProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}

export default function PageContent({ children, className, innerClassName }: PageContentProps) {
  return (
    <section className={cn('sheet-top px-4 py-6 sm:px-6 md:px-8 md:py-8 -mt-3 md:-mt-4 w-full', className)}>
      <div className={cn('max-w-6xl mx-auto w-full', innerClassName)}>{children}</div>
    </section>
  );
}
