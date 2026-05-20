import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContentProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}

export default function PageContent({ children, className, innerClassName }: PageContentProps) {
  return (
    <section className={cn('sheet-top px-4 py-8 sm:px-6 md:px-10 md:py-12 -mt-4 md:-mt-6 w-full', className)}>
      <div className={cn('max-w-7xl mx-auto w-full', innerClassName)}>{children}</div>
    </section>
  );
}
