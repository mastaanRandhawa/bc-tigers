import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PortalStat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
}

interface PortalStatGridProps {
  stats: PortalStat[];
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Shared stat grid for Coach / Player / Referee portal dashboards.
 * Replaces the repeated inline `portal-stat-card` markup.
 */
export default function PortalStatGrid({
  stats,
  columns = 4,
  className,
}: PortalStatGridProps) {
  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={cn('grid gap-3 sm:gap-4 mb-6', colClass, className)}>
      {stats.map((stat) => {
        const inner = (
          <div className="portal-stat-card group">
            <div className="portal-stat-icon">
              <stat.icon className="w-5 h-5" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </div>
          </div>
        );

        if (stat.href) {
          return (
            <Link key={stat.label} to={stat.href} className="group">
              {inner}
            </Link>
          );
        }
        return <div key={stat.label}>{inner}</div>;
      })}
    </div>
  );
}
