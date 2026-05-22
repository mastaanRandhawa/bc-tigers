import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface DirectoryCardProps {
  href: string;
  /** Color swatch / logo slot on the left */
  media?: ReactNode;
  /** Primary text */
  title: string;
  /** Secondary text below title */
  meta?: string;
  /** Badge or tag row below meta */
  badges?: ReactNode;
  /**
   * card — standalone rounded card with border + shadow (default)
   * row  — borderless list row; relies on parent container for separation
   */
  variant?: 'card' | 'row';
  /** Override chevron accent color on hover */
  accentColor?: string;
  className?: string;
}

/**
 * Shared directory-entry card with consistent hover/focus chrome.
 * Used by TeamCard, DivisionDirectoryCard, and any similar link-card.
 */
export default function DirectoryCard({
  href,
  media,
  title,
  meta,
  badges,
  variant = 'card',
  accentColor,
  className,
}: DirectoryCardProps) {
  const isRow = variant === 'row';

  return (
    <Link
      to={href}
      className={cn(
        'group flex items-center gap-3 transition-all duration-200',
        isRow
          ? 'px-4 py-3.5 hover:bg-secondary/50'
          : 'rounded-xl bg-card p-3.5 shadow-sm border border-border hover:shadow-md hover:border-primary/30',
        className,
      )}
    >
      {media && <div className="shrink-0">{media}</div>}

      <div className="min-w-0 flex-1">
        <h3
          className="truncate text-sm font-semibold text-foreground transition-colors"
          style={accentColor ? { ['--hover-color' as string]: accentColor } : undefined}
        >
          <span
            className={
              accentColor
                ? 'transition-colors group-hover:text-[var(--hover-color)]'
                : 'transition-colors group-hover:text-primary'
            }
          >
            {title}
          </span>
        </h3>
        {meta && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>
        )}
        {badges && <div className="mt-1 flex flex-wrap gap-1">{badges}</div>}
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground/70"
        aria-hidden
      />
    </Link>
  );
}
