import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = 'View all',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-foreground font-display m-0">
          {title}
        </h2>
        {subtitle && (
          <p className="text-body-sm mt-0.5 m-0">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          to={href}
          className="section-link inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
        >
          {linkLabel}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
