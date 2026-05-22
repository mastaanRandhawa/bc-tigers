import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getDivisionBasePath } from '@/lib/division-routes';
import { getDivisionTheme } from '@/lib/division-theme';
import { cn } from '@/lib/utils';
import type { Division } from '@/types';

interface DivisionDirectoryCardProps {
  division: Division;
  /**
   * card — standalone rounded card with border + shadow (default, used in listings)
   * row  — borderless list row; relies on parent container for separation
   */
  variant?: 'card' | 'row';
  description?: string;
}

export default function DivisionDirectoryCard({
  division,
  variant = 'card',
  description,
}: DivisionDirectoryCardProps) {
  const href = getDivisionBasePath(division);
  if (!href) return null;

  const theme = getDivisionTheme(division);
  const isRow = variant === 'row';

  return (
    <Link
      to={href}
      className={cn(
        'group flex items-center gap-3 transition-colors duration-150',
        isRow
          ? 'px-4 py-3.5 hover:bg-secondary/50'
          : 'rounded-xl bg-card p-3.5 shadow-sm border border-border hover:shadow-md hover:border-primary/30',
      )}
    >
      {/* Colored initials swatch */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-center text-xs font-black uppercase tracking-wider',
          isRow ? 'h-9 w-9 rounded-lg' : 'h-10 w-10 rounded-lg',
        )}
        style={{
          backgroundColor: theme.accent,
          color: theme.primary,
          border: `1.5px solid color-mix(in srgb, ${theme.primary} 22%, transparent)`,
        }}
        aria-hidden
      >
        {division.name.slice(0, 2)}
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className="truncate text-sm font-semibold text-foreground"
          style={{ ['--hover-color' as string]: theme.primary }}
        >
          <span className="transition-colors group-hover:text-[var(--hover-color,theme(colors.primary))]">
            {division.name}
          </span>
        </h3>
        {!isRow && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {description ?? division.tournament?.name}
          </p>
        )}
        <div className="mt-1 flex flex-wrap gap-1">
          {division.age_group && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: theme.accent, color: theme.accentForeground }}
            >
              {division.age_group}
            </span>
          )}
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: theme.accent, color: theme.accentForeground }}
          >
            {division.format}
          </span>
        </div>
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground/70"
        aria-hidden
      />
    </Link>
  );
}
