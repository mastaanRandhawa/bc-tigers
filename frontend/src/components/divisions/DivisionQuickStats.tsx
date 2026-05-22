import type { LucideIcon } from 'lucide-react';
import type { DivisionTheme } from '@/lib/division-theme';
import MetricCard from '@/components/shared/MetricCard';
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
  theme,
  className,
}: DivisionQuickStatsProps) {
  return (
    <div className={cn('mx-auto w-full max-w-4xl', className)}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <MetricCard
            key={stat.label}
            className="h-full"
            value={stat.value}
            label={stat.label}
            sublabel={stat.sublabel}
            icon={stat.icon}
            liveIndicator={stat.liveIndicator}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}
