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
        'flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 shadow-sm transition-all duration-200 hover:shadow-md',
        className,
      )}
      style={
        accent
          ? { outline: `1px solid ${accentBorder}` }
          : { outline: '1px solid hsl(var(--border) / 0.6)' }
      }
    >
      {Icon && (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={
            accent
              ? { backgroundColor: accentBg, color: accentColor, border: `1px solid ${accentBorder}` }
              : { backgroundColor: '#f4f4f5', color: '#71717a', border: '1px solid hsl(var(--border))' }
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
        <p className="mt-1 text-xs font-medium text-zinc-500">{label}</p>
        {trend && (
          <p className="mt-0.5 truncate text-[11px] text-zinc-400" title={trend}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
