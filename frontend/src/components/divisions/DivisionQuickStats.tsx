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
        'grid grid-cols-2 gap-px overflow-hidden border-2 border-foreground bg-foreground shadow-hard-sm sm:grid-cols-4 md:border-4',
        className,
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            'flex flex-col items-center bg-white px-3 py-3 text-center transition-colors duration-200 hover:bg-bauhaus-muted/50 sm:items-start sm:px-4 sm:py-3.5 sm:text-left',
            stat.accent && 'bg-primary-muted/40',
          )}
        >
          {stat.icon && (
            <stat.icon
              className="mb-1 h-4 w-4 text-foreground/40"
              aria-hidden
              style={stat.accent ? { color: accentColor } : undefined}
            />
          )}
          <p
            className="text-2xl font-black tabular-nums leading-none font-display sm:text-3xl"
            style={stat.accent ? { color: accentColor } : undefined}
          >
            {stat.value}
          </p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-foreground/55">{stat.label}</p>
          {stat.sublabel && (
            <p className="mt-0.5 max-w-full truncate text-[11px] font-medium text-foreground/45 normal-case" title={stat.sublabel}>
              {stat.sublabel}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
