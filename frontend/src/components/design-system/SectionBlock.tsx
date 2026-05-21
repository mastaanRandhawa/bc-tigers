import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SurfaceCard from '@/components/design-system/SurfaceCard';
import { cn } from '@/lib/utils';

interface SectionBlockProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: 'card' | 'flat';
}

export default function SectionBlock({
  title,
  subtitle,
  href,
  linkLabel = 'View all',
  aside,
  children,
  className,
  variant = 'card',
}: SectionBlockProps) {
  const header = (
    <div className="mb-3 flex items-start justify-between gap-3 border-b-2 border-foreground/10 pb-3">
      <div className="min-w-0">
        <h2 className="text-section m-0">{title}</h2>
        {subtitle && <p className="text-meta m-0 mt-1 normal-case">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {aside}
        {href && (
          <Link
            to={href}
            className="section-link inline-flex items-center gap-0.5 text-xs font-black uppercase tracking-widest text-primary transition-all hover:text-primary-hover hover:translate-x-0.5"
          >
            {linkLabel}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );

  if (variant === 'flat') {
    return (
      <section className={cn('space-y-3', className)}>
        {header}
        {children}
      </section>
    );
  }

  return (
    <SurfaceCard as="section" className={className}>
      {header}
      {children}
    </SurfaceCard>
  );
}
