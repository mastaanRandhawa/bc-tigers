import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContentProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}

export default function PageContent({ children, className, innerClassName }: PageContentProps) {
  return (
    <section className={cn('w-full py-5 md:py-6 page-fade-in', className)}>
      <div className={cn('page-container', innerClassName)}>{children}</div>
    </section>
  );
}
