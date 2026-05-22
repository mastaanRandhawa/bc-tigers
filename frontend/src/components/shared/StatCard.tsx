import type { LucideIcon } from 'lucide-react';
import type { DivisionTheme } from '@/lib/division-theme';
import { cn } from '@/lib/utils';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  trend?: string;
  accent?: boolean;
  /** Pass the division theme to colour accent state with division primary. */
  theme?: DivisionTheme;
  className?: string;
}

export default function StatCard({
  value,
  label,
  icon: Icon,
  trend,
  accent = false,
  theme,
  className,
}: StatCardProps) {
  const accentColor = theme?.primary ?? 'var(--color-primary)';
  const accentBg = theme?.accent ?? 'var(--color-accent)';
  const accentBorder = theme
    ? `color-mix(in srgb, ${theme.primary} 22%, transparent)`
    : undefined;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl bg-card px-3.5 py-3 shadow-sm transition-all duration-200 hover:shadow-md border',
        accent ? 'border-transparent' : 'border-border',
        className,
      )}
      style={accent && accentBorder ? { borderColor: accentBorder } : undefined}
    >
      {Icon && (
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
            accent ? 'border-transparent' : 'bg-secondary text-muted-foreground border-border',
          )}
          style={
            accent
              ? { backgroundColor: accentBg, color: accentColor, borderColor: accentBorder }
              : undefined
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className="text-2xl font-bold tabular-nums tracking-tight leading-none font-display"
          style={accent ? { color: accentColor } : undefined}
        >
          {value}
        </p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
        {trend && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70" title={trend}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
