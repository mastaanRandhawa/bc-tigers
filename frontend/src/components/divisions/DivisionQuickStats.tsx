import type { LucideIcon } from 'lucide-react';
import type { DivisionTheme } from '@/lib/division-theme';
import { cn } from '@/lib/utils';

export interface DivisionQuickStat {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: LucideIcon;
  /** @deprecated use liveIndicator instead; kept for backwards compatibility */
  accent?: boolean;
  /** Show a pulsing live dot next to the value */
  liveIndicator?: boolean;
}

interface DivisionQuickStatsProps {
  stats: DivisionQuickStat[];
  theme?: DivisionTheme;
  className?: string;
}

export default function DivisionQuickStats({
  stats,
  className,
}: DivisionQuickStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {stats.map((stat) => {
        const showLive = stat.liveIndicator ?? (stat.accent && Number(stat.value) > 0);
        return (
          <div
            key={stat.label}
            className="flex flex-col rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold tabular-nums leading-none font-display text-foreground">
                {stat.value}
              </p>
              {showLive && (
                <span
                  className="mt-0.5 inline-flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500"
                  aria-label="Live"
                />
              )}
            </div>
            <p className="mt-1.5 text-xs font-medium text-muted-foreground">{stat.label}</p>
            {stat.sublabel && (
              <p
                className="mt-0.5 max-w-full truncate text-[11px] font-medium text-foreground/70"
                title={stat.sublabel}
              >
                {stat.sublabel}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
