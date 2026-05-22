import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import type { DivisionTheme } from '@/lib/division-theme';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  value: string | number;
  label: string;
  /** Secondary detail line below the label */
  sublabel?: string;
  icon?: LucideIcon;
  /** Apply division accent colour to value + border */
  accent?: boolean;
  /** Show a pulsing live dot beside the value */
  liveIndicator?: boolean;
  /** Division theme — controls accent colour */
  theme?: DivisionTheme;
  /** Make the card a link */
  href?: string;
  className?: string;
}

function MetricCardInner({
  value,
  label,
  sublabel,
  icon: Icon,
  accent = false,
  liveIndicator = false,
  theme,
}: MetricCardProps) {
  const accentColor = theme?.primary ?? 'var(--color-primary)';
  const accentBg = theme?.accent ?? 'var(--color-accent)';
  const accentBorder = theme
    ? `color-mix(in srgb, ${theme.primary} 22%, transparent)`
    : undefined;

  const showLive = liveIndicator ?? (accent && Number(value) > 0);

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl border bg-card px-4 py-3.5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px',
        accent ? 'border-transparent' : 'border-border',
      )}
      style={accent && accentBorder ? { borderColor: accentBorder } : undefined}
    >
      {Icon && (
        <div
          className={cn(
            'mb-2 flex h-9 w-9 items-center justify-center rounded-lg border',
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
      <div className="flex items-center gap-2">
        <p
          className="text-3xl font-bold tabular-nums leading-none font-display"
          style={accent ? { color: accentColor } : undefined}
        >
          {value}
        </p>
        {showLive && (
          <span
            className="mt-0.5 inline-flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500"
            aria-label="Live"
          />
        )}
      </div>
      <p className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      {sublabel && (
        <p
          className="mt-0.5 max-w-full truncate text-[11px] font-medium text-foreground/70"
          title={sublabel}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}

/**
 * Unified metric / KPI tile.
 *
 * Replaces StatCard + DivisionQuickStats cells + portal stat tiles.
 * Pass `href` to make the card a link; pass `theme` for division accent colours.
 */
export default function MetricCard({ href, className, ...props }: MetricCardProps) {
  if (href) {
    return (
      <Link to={href} className={cn('group', className)}>
        <MetricCardInner {...props} />
      </Link>
    );
  }
  return (
    <div className={cn('h-full', className)}>
      <MetricCardInner {...props} />
    </div>
  );
}
