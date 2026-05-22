import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PillNavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  end?: boolean;
}

type PillNavVariant = 'default' | 'light' | 'dark' | 'division';
type PillNavLayout = 'scroll' | 'grid';

interface PillNavProps {
  items: PillNavItem[];
  ariaLabel?: string;
  className?: string;
  /**
   * default — neutral bg-secondary container (public pages, portals)
   * light   — white text on coloured/hero backgrounds (SiteHeader hero mode)
   * dark    — muted text on light/admin surfaces
   * division — uses --division-primary CSS var for active state
   */
  variant?: PillNavVariant;
  /**
   * scroll — horizontal overflow scroll (default, all breakpoints)
   * grid   — CSS grid; caller controls column count via className
   */
  layout?: PillNavLayout;
  /** Number of columns for grid layout */
  columns?: number;
}

const containerClass: Record<PillNavVariant, string> = {
  default: 'flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1 no-scrollbar snap-x snap-mandatory',
  light: 'flex gap-0.5 overflow-x-auto no-scrollbar',
  dark: 'flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1 no-scrollbar snap-x snap-mandatory',
  division: 'flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1 no-scrollbar snap-x snap-mandatory',
};

function itemClass(variant: PillNavVariant, isActive: boolean): string {
  const base = 'inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap';

  if (variant === 'light') {
    return cn(
      base,
      isActive
        ? 'bg-white text-primary font-semibold shadow-sm'
        : 'text-white/80 hover:text-white hover:bg-white/10',
    );
  }

  if (variant === 'division') {
    return cn(base, isActive ? 'division-nav-pill-active' : 'division-nav-pill');
  }

  return cn(
    base,
    isActive
      ? 'bg-card text-foreground font-semibold shadow-sm'
      : 'text-muted-foreground hover:text-foreground hover:bg-card/60',
  );
}

export default function PillNav({
  items,
  ariaLabel = 'Section navigation',
  className,
  variant = 'default',
  layout = 'scroll',
  columns,
}: PillNavProps) {
  const wrapperClass =
    layout === 'grid'
      ? cn(
          'grid rounded-xl bg-secondary p-1 gap-1',
          columns ? `grid-cols-${columns}` : 'grid-cols-auto',
          className,
        )
      : cn(containerClass[variant], className);

  return (
    <nav aria-label={ariaLabel} className="page-container">
      <div className={wrapperClass}>
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end ?? false}
            title={item.label}
            className={({ isActive }) =>
              cn(
                itemClass(variant, isActive),
                layout === 'grid' && 'justify-center w-full',
              )
            }
          >
            {item.icon && (
              <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            <span className={item.icon ? 'hidden sm:inline' : undefined}>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
