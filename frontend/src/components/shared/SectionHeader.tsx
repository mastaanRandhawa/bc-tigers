import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = 'View all',
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 mb-4', className)}>
      <div className="min-w-0">
        <h2 className="text-section m-0">{title}</h2>
        {subtitle && <p className="text-body-sm mt-1">{subtitle}</p>}
      </div>
      {action}
      {href && !action && (
        <Link
          to={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors shrink-0"
        >
          {linkLabel}
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
