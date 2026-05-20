import type { LucideIcon } from 'lucide-react';
import type { DivisionTheme } from '@/lib/division-theme';
import { cn } from '@/lib/utils';

export interface DivisionQuickStat {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: LucideIcon;
  accent?: boolean;
}

interface DivisionQuickStatsProps {
  stats: DivisionQuickStat[];
  theme?: DivisionTheme;
  className?: string;
}

export default function DivisionQuickStats({
  stats,
  theme,
  className,
}: DivisionQuickStatsProps) {
  const accentColor = theme?.primary ?? 'var(--color-primary)';

  return (
    <div
      className={cn(
        'grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border bg-white shadow-sm sm:grid-cols-4 sm:divide-y-0',
        className,
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            'flex flex-col items-center px-3 py-3 text-center sm:items-start sm:px-4 sm:py-3.5 sm:text-left',
            stat.accent && 'bg-primary-muted/40',
          )}
        >
          <p
            className="text-2xl font-bold tabular-nums leading-none font-display sm:text-3xl"
            style={stat.accent ? { color: accentColor } : undefined}
          >
            {stat.value}
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-500">{stat.label}</p>
          {stat.sublabel && (
            <p className="mt-0.5 max-w-full truncate text-[11px] text-zinc-400" title={stat.sublabel}>
              {stat.sublabel}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
